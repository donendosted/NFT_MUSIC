#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Vec};

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
}