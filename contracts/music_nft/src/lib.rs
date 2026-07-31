#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, String};

#[contract]
pub struct MusicNFT;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    TokenCounter,
    Owner(u32),
    Metadata(u32),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum MusicNftError {
    TokenNotFound = 1,
    NotTokenOwner = 2,
}

#[contractimpl]
impl MusicNFT {
    pub fn mint(env: Env, owner: Address, name: String, music_url: String, artist: String) -> u32 {
        let counter: u32 = env
            .storage()
            .instance()
            .get(&DataKey::TokenCounter)
            .unwrap_or(0);
        let token_id = counter + 1;
        env.storage().instance().set(&DataKey::TokenCounter, &token_id);

        env.storage().instance().set(&DataKey::Owner(token_id), &owner);
        env.storage().instance().set(&DataKey::Metadata(token_id), &(name, music_url, artist));

        token_id
    }

    pub fn get_owner(env: Env, token_id: u32) -> Option<Address> {
        env.storage().instance().get(&DataKey::Owner(token_id))
    }

    pub fn get_metadata(env: Env, token_id: u32) -> Option<(String, String, String)> {
        env.storage().instance().get(&DataKey::Metadata(token_id))
    }

    pub fn total_supply(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::TokenCounter).unwrap_or(0)
    }

    /// Transfers a token. A marketplace should escrow the token before a sale,
    /// allowing its contract authorization to settle the purchase atomically.
    pub fn transfer(
        env: Env,
        from: Address,
        to: Address,
        token_id: u32,
    ) -> Result<(), MusicNftError> {
        from.require_auth();
        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner(token_id))
            .ok_or(MusicNftError::TokenNotFound)?;
        if owner != from {
            return Err(MusicNftError::NotTokenOwner);
        }
        env.storage().instance().set(&DataKey::Owner(token_id), &to);
        Ok(())
    }
}
