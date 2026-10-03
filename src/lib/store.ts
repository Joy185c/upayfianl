import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  Wallet, 
  Transaction, 
  NotificationItem, 
  BenefitClaim,
  TransactionType 
} from '@/types/wallet';
import { supabase, isSupabaseConfigured } from './supabase';

const INITIAL_WALLET: Wallet = {
  id: '00000000-0000-0000-0000-000000000001',
  display_name: 'Karim Mondal',
  phone_number: '01700000000',
  balance: 5000.00,
  segment: 'valuable_active',
  pin: '1234',
};

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Welcome to Upay BD!',
    message: 'Your MFS account is ready. Explore quick services like Send Money, Recharge, and Pay Bill.',
    type: 'system',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'notif-2',
    title: 'ImpactIQ Benefit Unlocked',
    message: 'Get ৳20 Cashback on Mobile Recharge of ৳100 or more. Check the Benefits tab!',
    type: 'offer',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  }
];

interface WalletState {
  wallet: Wallet;
  transactions: Transaction[];
  notifications: NotificationItem[];
  benefitClaims: BenefitClaim[];
  hasUnreadNotifications: boolean;
  isLoading: boolean;

  // Actions
  fetchData: () => Promise<void>;
  updateProfile: (name: string, phone: string, newPin?: string) => Promise<boolean>;
  executeTransaction: (params: {
    type: TransactionType;
    amount: number;
    counterparty?: string;
    operator?: string;
    biller?: string;
    note?: string;
    pin: string;
  }) => Promise<{ success: boolean; message: string; transaction?: Transaction }>;
  
  markNotificationsAsRead: () => Promise<void>;
  claimBenefit: (benefitId: string, title: string, cashbackAmount?: number) => Promise<{ success: boolean; message: string }>;
  importJsonTransactions: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jsonData: Record<string, any>[], 
    applyToBalance: boolean
  ) => Promise<{ successCount: number; skippedCount: number; errors: string[] }>;
  clearImportedTransactions: () => Promise<{ clearedCount: number }>;
  resetDemoData: () => Promise<void>;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallet: INITIAL_WALLET,
      transactions: [],
      notifications: DEFAULT_NOTIFICATIONS,
      benefitClaims: [],
      hasUnreadNotifications: true,
      isLoading: false,

      fetchData: async () => {
        set({ isLoading: true });
        if (isSupabaseConfigured && supabase) {
          try {
            // 1. Fetch wallet
            const { data: walletData } = await supabase
              .from('wallets')
              .select('*')
              .eq('phone_number', get().wallet.phone_number)
              .single();

            if (walletData) {
              set({ wallet: walletData });
            }

            // 2. Fetch transactions
            const { data: txData } = await supabase
              .from('transactions')
              .select('*')
              .order('created_at', { ascending: false });

            if (txData) {
              set({ transactions: txData });
            }

            // 3. Fetch notifications
            const { data: notifData } = await supabase
              .from('notifications')
              .select('*')
              .order('created_at', { ascending: false });

            if (notifData && notifData.length > 0) {
              set({ 
                notifications: notifData,
                hasUnreadNotifications: notifData.some((n: NotificationItem) => !n.is_read)
              });
            }

            // 4. Fetch benefit claims
            const { data: claimData } = await supabase
              .from('benefit_claims')
              .select('*');

            if (claimData) {
              set({ benefitClaims: claimData });
            }
          } catch (err) {
            console.error('Error syncing with Supabase:', err);
          }
        }
        
        // Ensure unread notification status is accurate
        const unread = get().notifications.some(n => !n.is_read);
        set({ hasUnreadNotifications: unread, isLoading: false });
      },

      updateProfile: async (name: string, phone: string, newPin?: string) => {
        const currentWallet = get().wallet;
        const updatedWallet: Wallet = {
          ...currentWallet,
          display_name: name.trim() || currentWallet.display_name,
          phone_number: phone.trim() || currentWallet.phone_number,
          pin: newPin ? newPin.trim() : currentWallet.pin,
          updated_at: new Date().toISOString()
        };

        set({ wallet: updatedWallet });

        if (isSupabaseConfigured && supabase) {
          try {
            await supabase
              .from('wallets')
              .update({
                display_name: updatedWallet.display_name,
                phone_number: updatedWallet.phone_number,
                pin: updatedWallet.pin,
                updated_at: updatedWallet.updated_at
              })
              .eq('id', updatedWallet.id);
          } catch (err) {
            console.error('Supabase profile update failed', err);
          }
        }
        return true;
      },

      executeTransaction: async ({ type, amount, counterparty, operator, biller, note, pin }) => {
        const { wallet, transactions, notifications } = get();

        // 1. PIN validation
        if (pin !== wallet.pin) {
          return { success: false, message: 'Invalid 4-digit PIN entered. Please try again.' };
        }

        // 2. Amount validation
        if (isNaN(amount) || amount <= 0) {
          return { success: false, message: 'Please enter a valid amount greater than 0.' };
        }

        // 3. Fee & Total Calculation
        let fee = 0;
        let isCredit = false;

        if (type === 'cash_out') {
          // Standard MFS Cash Out fee: 1.49%
          fee = Math.round(amount * 0.0149 * 100) / 100;
        }

        const totalAmount = type === 'cash_out' ? amount + fee : amount;

        if (type === 'add_money' || type === 'cashback') {
          isCredit = true;
        }

        // 4. Balance sufficiency check for debit
        if (!isCredit && totalAmount > wallet.balance) {
          return {
            success: false,
            message: `Insufficient balance. Available: ৳${wallet.balance.toFixed(2)}, Required: ৳${totalAmount.toFixed(2)}`
          };
        }

        // 5. Calculate new balance
        const newBalance = isCredit
          ? wallet.balance + amount
          : wallet.balance - totalAmount;

        const txId = `UPAY${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100)}`;
        const now = new Date().toISOString();

        let counterpartyName = counterparty || '';
        if (type === 'mobile_recharge') counterpartyName = `${operator || 'Mobile'} (${counterparty || 'Mobile'})`;
        if (type === 'pay_bill') counterpartyName = `${biller || 'Utility Bill'} - ${counterparty || ''}`;
        if (type === 'add_money') counterpartyName = counterparty || 'Bank Card';
        if (type === 'cash_out') counterpartyName = `Agent (${counterparty || 'MFS Agent'})`;

        const newTransaction: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          wallet_id: wallet.id,
          transaction_id: txId,
          type,
          amount,
          fee,
          total_amount: totalAmount,
          balance_after: Math.round(newBalance * 100) / 100,
          counterparty: counterpartyName,
          operator,
          biller,
          note,
          status: 'success',
          is_imported: false,
          created_at: now,
        };

        // Create notification
        const typeLabels: Record<TransactionType, string> = {
          send_money: 'Money Sent',
          mobile_recharge: 'Mobile Recharge Successful',
          pay_merchant: 'Merchant Payment Done',
          pay_bill: 'Bill Payment Successful',
          cash_out: 'Cash Out Successful',
          add_money: 'Money Added',
          cashback: 'Cashback Received',
        };

        const notifTitle = typeLabels[type] || 'Transaction Successful';
        const notifMsg = isCredit
          ? `৳${amount.toFixed(2)} credited to your wallet. Trx ID: ${txId}`
          : `৳${totalAmount.toFixed(2)} debited for ${notifTitle}. Trx ID: ${txId}`;

        const newNotif: NotificationItem = {
          id: `notif-${Date.now()}`,
          wallet_id: wallet.id,
          title: notifTitle,
          message: notifMsg,
          type: 'transaction',
          is_read: false,
          transaction_id: txId,
          created_at: now,
        };

        // Update local state immediately
        const updatedWallet = { ...wallet, balance: Math.round(newBalance * 100) / 100 };
        const updatedTxs = [newTransaction, ...transactions];
        const updatedNotifs = [newNotif, ...notifications];

        set({
          wallet: updatedWallet,
          transactions: updatedTxs,
          notifications: updatedNotifs,
          hasUnreadNotifications: true,
        });

        // Persist to Supabase if configured
        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.from('wallets').update({ balance: updatedWallet.balance }).eq('id', wallet.id);
            await supabase.from('transactions').insert([{
              wallet_id: wallet.id,
              transaction_id: newTransaction.transaction_id,
              type: newTransaction.type,
              amount: newTransaction.amount,
              fee: newTransaction.fee,
              total_amount: newTransaction.total_amount,
              balance_after: newTransaction.balance_after,
              counterparty: newTransaction.counterparty,
              operator: newTransaction.operator,
              biller: newTransaction.biller,
              note: newTransaction.note,
              status: newTransaction.status,
              is_imported: false,
              created_at: newTransaction.created_at,
            }]);
            await supabase.from('notifications').insert([{
              wallet_id: wallet.id,
              title: newNotif.title,
              message: newNotif.message,
              type: newNotif.type,
              is_read: false,
              transaction_id: txId,
              created_at: newNotif.created_at
            }]);
          } catch (err) {
            console.error('Supabase write error', err);
          }
        }

        return {
          success: true,
          message: `${notifTitle} of ৳${amount.toFixed(2)} completed successfully.`,
          transaction: newTransaction,
        };
      },

      markNotificationsAsRead: async () => {
        const updatedNotifs = get().notifications.map(n => ({ ...n, is_read: true }));
        set({ notifications: updatedNotifs, hasUnreadNotifications: false });

        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.from('notifications').update({ is_read: true }).eq('wallet_id', get().wallet.id);
          } catch (err) {
            console.error('Supabase notification update error', err);
          }
        }
      },

      claimBenefit: async (benefitId: string, title: string, cashbackAmount: number = 20) => {
        const { wallet, benefitClaims, notifications } = get();

        // Check if already claimed
        if (benefitClaims.some(c => c.benefit_id === benefitId)) {
          return { success: false, message: 'You have already claimed this benefit offer.' };
        }

        const newClaim: BenefitClaim = {
          id: `claim-${Date.now()}`,
          wallet_id: wallet.id,
          benefit_id: benefitId,
          title,
          cashback_amount: cashbackAmount,
          status: 'active',
          created_at: new Date().toISOString(),
        };

        const updatedClaims = [...benefitClaims, newClaim];

        // Process instant cashback bonus if applicable
        let updatedBalance = wallet.balance;
        if (cashbackAmount > 0) {
          updatedBalance += cashbackAmount;
        }

        const notif: NotificationItem = {
          id: `notif-benefit-${Date.now()}`,
          wallet_id: wallet.id,
          title: 'ImpactIQ Benefit Claimed!',
          message: `You successfully activated "${title}". ${cashbackAmount > 0 ? `৳${cashbackAmount} Cashback credited to your wallet!` : ''}`,
          type: 'benefit',
          is_read: false,
          created_at: new Date().toISOString(),
        };

        set({
          wallet: { ...wallet, balance: Math.round(updatedBalance * 100) / 100 },
          benefitClaims: updatedClaims,
          notifications: [notif, ...notifications],
          hasUnreadNotifications: true,
        });

        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.from('benefit_claims').insert([{
              wallet_id: wallet.id,
              benefit_id: benefitId,
              title,
              cashback_amount: cashbackAmount,
              status: 'active',
            }]);
            await supabase.from('notifications').insert([{
              wallet_id: wallet.id,
              title: notif.title,
              message: notif.message,
              type: notif.type,
              is_read: false,
              created_at: notif.created_at,
            }]);
            if (cashbackAmount > 0) {
              await supabase.from('wallets').update({ balance: updatedBalance }).eq('id', wallet.id);
            }
          } catch (err) {
            console.error('Supabase benefit claim error', err);
          }
        }

        return {
          success: true,
          message: `Benefit "${title}" successfully activated!`,
        };
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      importJsonTransactions: async (jsonData: Record<string, any>[], applyToBalance: boolean) => {
        const { wallet, transactions } = get();

        if (!Array.isArray(jsonData)) {
          return { successCount: 0, skippedCount: 0, errors: ['JSON content must be an array of transaction objects.'] };
        }

        const validTypes: TransactionType[] = [
          'send_money',
          'mobile_recharge',
          'pay_merchant',
          'pay_bill',
          'cash_out',
          'add_money',
          'cashback',
        ];

        const typeAliasMap: Record<string, TransactionType> = {
          send: 'send_money',
          send_money: 'send_money',
          recharge: 'mobile_recharge',
          mobile_recharge: 'mobile_recharge',
          merchant: 'pay_merchant',
          merchant_payment: 'pay_merchant',
          pay_merchant: 'pay_merchant',
          bill: 'pay_bill',
          bill_payment: 'pay_bill',
          pay_bill: 'pay_bill',
          cash_out: 'cash_out',
          cashout: 'cash_out',
          add: 'add_money',
          add_money: 'add_money',
          cashback: 'cashback',
        };

        let successCount = 0;
        let skippedCount = 0;
        const errors: string[] = [];
        const newTxs: Transaction[] = [];
        let balanceAdjustment = 0;

        const existingTxIds = new Set(transactions.map(t => t.transaction_id));

        jsonData.forEach((item, index) => {
          const rowNum = index + 1;
          if (!item || typeof item !== 'object') {
            errors.push(`Row ${rowNum}: Invalid object format.`);
            return;
          }

          const rawType = String(item.type || item.transaction_type || '').toLowerCase();
          const mappedType = typeAliasMap[rawType];

          if (!mappedType || !validTypes.includes(mappedType)) {
            errors.push(`Row ${rowNum}: Invalid transaction type "${rawType}". Valid types: ${validTypes.join(', ')}`);
            return;
          }

          const amount = Number(item.amount);
          if (isNaN(amount) || amount <= 0) {
            errors.push(`Row ${rowNum}: Invalid amount "${item.amount}". Must be a number > 0.`);
            return;
          }

          const txId = item.transaction_id || item.tx_id || item.id || `IMPORT${Date.now()}${index}`;

          if (existingTxIds.has(txId)) {
            skippedCount++;
            return;
          }

          const counterparty = item.counterparty || item.recipient || item.merchant || item.operator || item.biller || item.note || 'Imported Entry';
          const fee = Number(item.fee) || 0;
          const totalAmount = item.total_amount ? Number(item.total_amount) : (mappedType === 'cash_out' ? amount + fee : amount);
          const createdAt = item.created_at || item.timestamp || item.date || new Date().toISOString();

          const isCredit = mappedType === 'add_money' || mappedType === 'cashback';
          if (applyToBalance) {
            if (isCredit) {
              balanceAdjustment += amount;
            } else {
              balanceAdjustment -= totalAmount;
            }
          }

          const tx: Transaction = {
            id: `imported-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 5)}`,
            wallet_id: wallet.id,
            transaction_id: String(txId),
            type: mappedType,
            amount,
            fee,
            total_amount: totalAmount,
            balance_after: Math.round((wallet.balance + balanceAdjustment) * 100) / 100,
            counterparty,
            operator: item.operator || undefined,
            biller: item.biller || undefined,
            note: item.note || undefined,
            status: item.status === 'failed' || item.status === 'pending' ? item.status : 'success',
            is_imported: true,
            created_at: createdAt,
          };

          existingTxIds.add(tx.transaction_id);
          newTxs.push(tx);
          successCount++;
        });

        if (newTxs.length > 0) {
          const finalBalance = applyToBalance
            ? Math.max(0, Math.round((wallet.balance + balanceAdjustment) * 100) / 100)
            : wallet.balance;

          const updatedTransactions = [...newTxs, ...transactions].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          const importNotif: NotificationItem = {
            id: `notif-import-${Date.now()}`,
            wallet_id: wallet.id,
            title: 'JSON Data Imported',
            message: `Successfully imported ${successCount} transactions into History.`,
            type: 'system',
            is_read: false,
            created_at: new Date().toISOString(),
          };

          set({
            wallet: { ...wallet, balance: finalBalance },
            transactions: updatedTransactions,
            notifications: [importNotif, ...get().notifications],
            hasUnreadNotifications: true,
          });

          if (isSupabaseConfigured && supabase) {
            try {
              if (applyToBalance) {
                await supabase.from('wallets').update({ balance: finalBalance }).eq('id', wallet.id);
              }
              await supabase.from('transactions').insert(newTxs.map(t => ({
                wallet_id: wallet.id,
                transaction_id: t.transaction_id,
                type: t.type,
                amount: t.amount,
                fee: t.fee,
                total_amount: t.total_amount,
                balance_after: t.balance_after,
                counterparty: t.counterparty,
                operator: t.operator,
                biller: t.biller,
                note: t.note,
                status: t.status,
                is_imported: true,
                created_at: t.created_at,
              })));
            } catch (err) {
              console.error('Supabase import write error', err);
            }
          }
        }

        return { successCount, skippedCount, errors };
      },

      clearImportedTransactions: async () => {
        const { transactions } = get();
        const importedCount = transactions.filter(t => t.is_imported).length;
        const filteredTxs = transactions.filter(t => !t.is_imported);

        set({ transactions: filteredTxs });

        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.from('transactions').delete().eq('is_imported', true);
          } catch (err) {
            console.error('Supabase clear imported error', err);
          }
        }

        return { clearedCount: importedCount };
      },

      resetDemoData: async () => {
        set({
          wallet: INITIAL_WALLET,
          transactions: [],
          notifications: DEFAULT_NOTIFICATIONS,
          benefitClaims: [],
          hasUnreadNotifications: true,
        });
      },
    }),
    {
      name: 'upay-bd-wallet-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
