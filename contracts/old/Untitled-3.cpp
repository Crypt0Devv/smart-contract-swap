#include "../../imports/stdlib.fc";

;; Storage structure: (owner_address, balance)

;; Constants (replace with actual addresses)
const STONFI_ADDRESS = "EQBfBWT7Xg-9eX68SnSmYQnMDBfFUqxF0Z3TcXQ2Xz8_QCnA"c;
const DEDUST_ADDRESS = "EQCjk1hh952vWaE9bRguFkAhDAL5jj3xj9p0uPWrFBq_GEMS"c;

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

    if (op == 1) { ;; Swap TON to token (including sent TON)
        int amount_to_swap = in_msg_body~load_coins();
        slice token_address = in_msg_body~load_msg_addr();
        int dex_choice = in_msg_body~load_uint(1); ;; 0 for StonFi, 1 for DeDust
        (slice owner_address, int balance) = load_data();
        
        ;; Include the sent TON in the swap amount
        amount_to_swap += msg_value;

        throw_unless(401, equal_slices(sender_address, owner_address));
        
        ;; Prepare swap message
        cell swap_payload = begin_cell()
            .store_uint(dex_choice ? 0x595f07bc : 0x7362d09c, 32)  ;; op: swap (use actual opcodes)
            .store_uint(0, 64)           ;; query_id
            .store_coins(amount_to_swap) ;; amount of TON to swap (including sent TON)
            .store_slice(token_address)  ;; address of token to receive
            .store_slice(owner_address)  ;; address to receive swapped tokens
            .end_cell();

        var msg = begin_cell()
            .store_uint(0x10, 6)         ;; nobounce
            .store_slice(dex_choice ? DEDUST_ADDRESS : STONFI_ADDRESS)
            .store_coins(amount_to_swap)
            .store_uint(1, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .store_ref(swap_payload)
            .end_cell();

        send_raw_message(msg, 1); ;; pay transfer fees separately
        return ();
    }

    throw(0xffff); ;; If the op is unknown
}

;; ... (rest of the contract remains the same)