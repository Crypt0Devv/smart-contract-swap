#include "../../imports/stdlib.fc";

;; Storage structure: (owner_address, balance)

() recv_internal(int msg_value, cell in_msg, slice in_msg_body) impure {
    slice cs = in_msg.begin_parse();
    int flags = cs~load_uint(4);
    
    if (flags & 1) { ;; Ignore all bounced messages
        return ();
    }

    slice sender_address = cs~load_msg_addr();
    int op = in_msg_body~load_uint(32);

    if (op == 0) { ;; Deposit operation
        (slice owner_address, int balance) = load_data();
        balance += msg_value;
        save_data(owner_address, balance);
        return ();
    }

    if (op == 1) { ;; Withdraw operation
        int withdraw_amount = in_msg_body~load_coins();
        (slice owner_address, int balance) = load_data();
        throw_unless(401, equal_slices(sender_address, owner_address));
        throw_unless(402, balance >= withdraw_amount);

        balance -= withdraw_amount;
        save_data(owner_address, balance);

        ;; Send withdrawn amount to the owner
        var msg = begin_cell()
            .store_uint(0x10, 6) ;; nobounce
            .store_slice(owner_address)
            .store_coins(withdraw_amount)
            .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .end_cell();
        send_raw_message(msg, 1); ;; pay transfer fees separately
        return ();
    }
    if (op == 2) { ;; Swap TON to token on StonFi
        int amount_to_swap = in_msg_body~load_coins();
        slice token_address = in_msg_body~load_msg_addr();
        (slice owner_address, int balance) = load_data();
        throw_unless(401, equal_slices(sender_address, owner_address));
        throw_unless(402, balance >= amount_to_swap);

        balance -= amount_to_swap;
        save_data(owner_address, balance);

        ;; Prepare message to StonFi for swap
        cell swap_payload = begin_cell()
            .store_uint(0x7362d09c, 32)  ;; op: swap (example opcode, replace with actual StonFi opcode)
            .store_uint(0, 64)           ;; query_id
            .store_coins(amount_to_swap) ;; amount of TON to swap
            .store_slice(token_address)  ;; address of token to receive
            .store_slice(owner_address)  ;; address to receive swapped tokens
            .end_cell();

        var msg = begin_cell()
            .store_uint(0x10, 6)         ;; nobounce
            .store_slice(STONFI_ADDRESS) ;; Replace with actual StonFi contract address
            .store_coins(amount_to_swap)
            .store_uint(1, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .store_ref(swap_payload)
            .end_cell();

        send_raw_message(msg, 1); ;; pay transfer fees separately
        return ();
    }

    throw(0xffff); ;; If the op is unknown
}

(slice, int) load_data() inline {
    slice ds = get_data().begin_parse();
    return (ds~load_msg_addr(), ds~load_coins());
}

() save_data(slice owner_address, int balance) impure inline {
    set_data(begin_cell()
        .store_slice(owner_address)
        .store_coins(balance)
        .end_cell());
}

int get_balance() method_id {
    (_, int balance) = load_data();
    return balance;
}

slice get_owner() method_id {
    (slice owner_address, _) = load_data();
    return owner_address;
}