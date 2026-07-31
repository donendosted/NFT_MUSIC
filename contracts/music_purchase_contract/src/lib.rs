#![no_std]

//! Atomic purchase settlement for Music NFT marketplace listings.
//!
//! The marketplace contract is responsible for creating/escrowing listings and
//! must expose the `Marketplace` interface below. `complete_sale` must transfer
//! the NFT and deactivate the listing in the same invocation. Soroban rolls back
//! the token transfer if that cross-contract call fails.

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, symbol_short, token,
    Address, Env, String, Vec,
};

#[contract]
pub struct MusicPurchaseContract;

#[derive(Clone)]
#[contracttype]
pub struct Config {
    pub admin: Address,
    pub nft_contract: Address,
    pub marketplace_contract: Address,
    /// Soroban token contract used for settlement (for example the Stellar asset contract).
    pub asset: Address,
}

/// ABI shared with the marketplace contract. The marketplace must persist its
/// listings in a compatible shape and only complete an active listing once.
#[derive(Clone)]
#[contracttype]
pub struct Listing {
    pub listing_id: u64,
    pub nft_contract: Address,
    pub seller: Address,
    pub token_id: u32,
    pub price: i128,
    pub asset: Address,
    pub active: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct Purchase {
    pub purchase_id: u64,
    pub listing_id: u64,
    pub nft_contract: Address,
    pub marketplace_contract: Address,
    pub seller: Address,
    pub buyer: Address,
    pub token_id: u32,
    pub purchase_price: i128,
    pub asset: Address,
    pub purchase_timestamp: u64,
    pub ledger_sequence: u32,
    /// Soroban contracts do not have the enclosing transaction hash. The API
    /// persists the RPC-confirmed hash in its purchase record after settlement.
    pub transaction_hash: String,
    pub purchase_status: u32,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Config,
    PurchaseCount,
    Purchase(u64),
    ListingPurchase(u64),
    BuyerHistory(Address),
    SellerHistory(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum PurchaseError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    ListingNotFound = 3,
    ListingInactive = 4,
    BuyerIsSeller = 5,
    OfferedPriceMismatch = 6,
    InvalidListing = 7,
    InvalidPrice = 8,
    NftOwnerMismatch = 9,
    AlreadyPurchased = 10,
    OwnershipTransferFailed = 11,
}

#[contractclient(name = "MarketplaceClient")]
pub trait Marketplace {
    fn get_listing(env: Env, listing_id: u64) -> Option<Listing>;
    /// Must transfer the listed NFT to `buyer` and mark this listing sold.
    fn complete_sale(env: Env, listing_id: u64, buyer: Address);
}

#[contractclient(name = "MusicNftClient")]
pub trait MusicNft {
    fn get_owner(env: Env, token_id: u32) -> Option<Address>;
}

#[contractimpl]
impl MusicPurchaseContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        nft_contract: Address,
        marketplace_contract: Address,
        asset: Address,
    ) -> Result<(), PurchaseError> {
        admin.require_auth();
        if env.storage().instance().has(&DataKey::Config) {
            return Err(PurchaseError::AlreadyInitialized);
        }

        env.storage().instance().set(
            &DataKey::Config,
            &Config {
                admin,
                nft_contract,
                marketplace_contract,
                asset,
            },
        );
        env.storage().instance().set(&DataKey::PurchaseCount, &0_u64);
        Ok(())
    }

    /// Settles payment and NFT delivery atomically. The buyer authorizes this
    /// invocation; the marketplace enforces the seller's listing/escrow rules.
    pub fn buy_music(
        env: Env,
        listing_id: u64,
        buyer: Address,
        offered_price: i128,
    ) -> Result<Purchase, PurchaseError> {
        buyer.require_auth();
        let config: Config = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .ok_or(PurchaseError::NotInitialized)?;

        if env.storage().instance().has(&DataKey::ListingPurchase(listing_id)) {
            return Err(PurchaseError::AlreadyPurchased);
        }

        let marketplace = MarketplaceClient::new(&env, &config.marketplace_contract);
        let listing = marketplace
            .get_listing(&listing_id)
            .ok_or(PurchaseError::ListingNotFound)?;

        if !listing.active {
            return Err(PurchaseError::ListingInactive);
        }
        if listing.seller == buyer {
            return Err(PurchaseError::BuyerIsSeller);
        }
        if listing.price <= 0 || offered_price <= 0 {
            return Err(PurchaseError::InvalidPrice);
        }
        if listing.price != offered_price {
            return Err(PurchaseError::OfferedPriceMismatch);
        }
        if listing.nft_contract != config.nft_contract || listing.asset != config.asset {
            return Err(PurchaseError::InvalidListing);
        }

        let nft = MusicNftClient::new(&env, &config.nft_contract);
        let owner = nft
            .get_owner(&listing.token_id)
            .ok_or(PurchaseError::NftOwnerMismatch)?;
        // A marketplace may hold the NFT in escrow, or the listing mechanism may
        // retain seller ownership and authorize `complete_sale` to move it.
        if owner != listing.seller && owner != config.marketplace_contract {
            return Err(PurchaseError::NftOwnerMismatch);
        }

        // If `complete_sale` fails, Soroban reverts this payment transfer too.
        token::Client::new(&env, &config.asset).transfer(&buyer, &listing.seller, &listing.price);
        marketplace.complete_sale(&listing_id, &buyer);

        let new_owner = nft
            .get_owner(&listing.token_id)
            .ok_or(PurchaseError::OwnershipTransferFailed)?;
        if new_owner != buyer {
            return Err(PurchaseError::OwnershipTransferFailed);
        }

        let purchase_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::PurchaseCount)
            .unwrap_or(0)
            + 1;
        let purchase = Purchase {
            purchase_id,
            listing_id,
            nft_contract: config.nft_contract,
            marketplace_contract: config.marketplace_contract,
            seller: listing.seller,
            buyer: buyer.clone(),
            token_id: listing.token_id,
            purchase_price: listing.price,
            asset: config.asset,
            purchase_timestamp: env.ledger().timestamp(),
            ledger_sequence: env.ledger().sequence(),
            transaction_hash: String::from_str(&env, ""),
            purchase_status: 1,
        };

        env.storage().instance().set(&DataKey::PurchaseCount, &purchase_id);
        env.storage().instance().set(&DataKey::Purchase(purchase_id), &purchase);
        env.storage()
            .instance()
            .set(&DataKey::ListingPurchase(listing_id), &purchase_id);
        Self::append_history(&env, DataKey::BuyerHistory(buyer), purchase_id);
        Self::append_history(&env, DataKey::SellerHistory(listing.seller.clone()), purchase_id);

        env.events().publish(
            (symbol_short!("purchase"), symbol_short!("complete")),
            purchase.clone(),
        );
        Ok(purchase)
    }

    pub fn get_purchase(env: Env, purchase_id: u64) -> Option<Purchase> {
        env.storage().instance().get(&DataKey::Purchase(purchase_id))
    }

    pub fn get_purchase_history(env: Env, account: Address) -> Vec<Purchase> {
        let ids: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::BuyerHistory(account.clone()))
            .unwrap_or(Vec::new(&env));
        let mut purchases = Vec::new(&env);
        for id in ids.iter() {
            if let Some(purchase) = env.storage().instance().get(&DataKey::Purchase(id)) {
                purchases.push_back(purchase);
            }
        }
        purchases
    }

    fn append_history(env: &Env, key: DataKey, purchase_id: u64) {
        let mut history: Vec<u64> = env.storage().instance().get(&key).unwrap_or(Vec::new(env));
        history.push_back(purchase_id);
        env.storage().instance().set(&key, &history);
    }
}
