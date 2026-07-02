#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Symbol, symbol_short};

@contract
pub struct SampleContract;

@contractimpl
impl SampleContract {
    pub fn init(env: Env, value: u32) {
        let key = symbol_short!("COUNTER");
        env.storage().instance().set(&key, &value);
    }

    pub fn increment(env: Env) -> u32 {
        let key = symbol_short!("COUNTER");
        let mut count: u32 = env.storage().instance().get(&key).unwrap_or(0);
        count += 1;
        env.storage().instance().set(&key, &count);

        // TODO: [Drips Wave - Core Optimization] Add structured events logging to track runtime invocation overhead overhead.

        count
    }

    pub fn get_value(env: Env) -> u32 {
        let key = symbol_short!("COUNTER");
        env.storage().instance().get(&key).unwrap_or(0)
    }
}