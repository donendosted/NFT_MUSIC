#![no_std]

//! Escrow listing contract used by `music_purchase_contract`.
//! It deliberately has no payment logic: only the purchase contract may call
//! `complete_sale`, ensuring that payment and delivery settle atomically.

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, Address, Env,
};

#[contract]
pub struct MusicMarketplaceContract;

#[derive(Clone)]
#[contracttype]
pub struct Config {
    pub admin: Address,
    pub nft_contract: Address,
    pub asset: Address,
    pub purchase_contract: Address,
}

/// Kept byte-for-byte compatible with `music_purchase_contract::Listing`.
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
pub enum DataKey {
    Config,
    ListingCount,
    Listing(u64),
    TokenListing(u32),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum MarketplaceError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidPrice = 3,
    TokenAlreadyListed = 4,
    NotTokenOwner = 5,
    ListingNotFound = 6,
    ListingInactive = 7,
    UnauthorizedSettlement = 8,
    EscrowOwnerMismatch = 9,
}

/// Mirrors the error values exported by the Music NFT contract.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum MusicNftError {
    TokenNotFound = 1,
    NotTokenOwner = 2,
}

#[contractclient(name = "MusicNftClient")]
pub trait MusicNft {
    fn get_owner(env: Env, token_id: u32) -> Option<Address>;
    fn transfer(env: Env, from: Address, to: Address, token_id: u32) -> Result<(), MusicNftError>;
}

#[contractimpl]
impl MusicMarketplaceContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        nft_contract: Address,
        asset: Address,
        purchase_contract: Address,
    ) -> Result<(), MarketplaceError> {
        admin.require_auth();
        if env.storage().instance().has(&DataKey::Config) {
            return Err(MarketplaceError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Config, &Config { admin, nft_contract, asset, purchase_contract });
        env.storage().instance().set(&DataKey::ListingCount, &0_u64);
        Ok(())
    }

    /// Seller authorizes escrow of a Music NFT and creates an active listing.
    pub fn list_music(env: Env, seller: Address, token_id: u32, price: i128) -> Result<u64, MarketplaceError> {
        seller.require_auth();
        let config: Config = env.storage().instance().get(&DataKey::Config).ok_or(MarketplaceError::NotInitialized)?;
        if price <= 0 { return Err(MarketplaceError::InvalidPrice); }
        if env.storage().instance().has(&DataKey::TokenListing(token_id)) { return Err(MarketplaceError::TokenAlreadyListed); }
        let nft = MusicNftClient::new(&env, &config.nft_contract);
        if nft.get_owner(&token_id).ok_or(MarketplaceError::NotTokenOwner)? != seller { return Err(MarketplaceError::NotTokenOwner); }
        // The seller's root authorization is used by the direct NFT call.
        nft.transfer(&seller, &env.current_contract_address(), &token_id);
        let listing_id: u64 = env.storage().instance().get(&DataKey::ListingCount).unwrap_or(0) + 1;
        let listing = Listing { listing_id, nft_contract: config.nft_contract, seller, token_id, price, asset: config.asset, active: true };
        env.storage().instance().set(&DataKey::ListingCount, &listing_id);
        env.storage().instance().set(&DataKey::Listing(listing_id), &listing);
        env.storage().instance().set(&DataKey::TokenListing(token_id), &listing_id);
        Ok(listing_id)
    }

    pub fn get_listing(env: Env, listing_id: u64) -> Option<Listing> {
        env.storage().instance().get(&DataKey::Listing(listing_id))
    }

    /// Only the configured purchase contract can release an escrowed NFT.
    pub fn complete_sale(env: Env, listing_id: u64, buyer: Address) -> Result<(), MarketplaceError> {
        let config: Config = env.storage().instance().get(&DataKey::Config).ok_or(MarketplaceError::NotInitialized)?;
        config.purchase_contract.require_auth();
        let mut listing: Listing = env.storage().instance().get(&DataKey::Listing(listing_id)).ok_or(MarketplaceError::ListingNotFound)?;
        if !listing.active { return Err(MarketplaceError::ListingInactive); }
        let marketplace = env.current_contract_address();
        let nft = MusicNftClient::new(&env, &config.nft_contract);
        if nft.get_owner(&listing.token_id).ok_or(MarketplaceError::EscrowOwnerMismatch)? != marketplace { return Err(MarketplaceError::EscrowOwnerMismatch); }
        nft.transfer(&marketplace, &buyer, &listing.token_id);
        listing.active = false;
        env.storage().instance().set(&DataKey::Listing(listing_id), &listing);
        env.storage().instance().remove(&DataKey::TokenListing(listing.token_id));
        Ok(())
    }
}
