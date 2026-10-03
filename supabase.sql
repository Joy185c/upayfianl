-- Supabase Schema for Upay BD (ImpactIQ) MFS Wallet App

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL DEFAULT 'Karim Mondal',
    phone_number VARCHAR(20) NOT NULL DEFAULT '01700000000',
    balance NUMERIC(12, 2) NOT NULL DEFAULT 5000.00 CHECK (balance >= 0),
    segment VARCHAR(50) NOT NULL DEFAULT 'valuable_active',
    pin VARCHAR(10) NOT NULL DEFAULT '1234',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('send_money', 'mobile_recharge', 'pay_merchant', 'pay_bill', 'cash_out', 'add_money', 'cashback')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    counterparty VARCHAR(150),
    operator VARCHAR(50),
    biller VARCHAR(100),
    note TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'pending', 'failed')),
    is_imported BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'transaction',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    transaction_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Benefit Claims Table
CREATE TABLE IF NOT EXISTS public.benefit_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    benefit_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    cashback_amount NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_wallet_id ON public.notifications(wallet_id);
CREATE INDEX IF NOT EXISTS idx_benefit_claims_wallet_id ON public.benefit_claims(wallet_id);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_claims ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies (Allow access for demo & authenticated users)
CREATE POLICY "Allow public read access to wallets" ON public.wallets FOR SELECT USING (true);
CREATE POLICY "Allow public update access to wallets" ON public.wallets FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access to transactions" ON public.transactions FOR DELETE USING (true);

CREATE POLICY "Allow public read access to notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to notifications" ON public.notifications FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to benefit_claims" ON public.benefit_claims FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to benefit_claims" ON public.benefit_claims FOR INSERT WITH CHECK (true);

-- 9. Seed Initial Default Wallet for Demo
INSERT INTO public.wallets (id, display_name, phone_number, balance, segment, pin)
VALUES ('00000000-0000-0000-0000-000000000001', 'Karim Mondal', '01700000000', 5000.00, 'valuable_active', '1234')
ON CONFLICT (id) DO NOTHING;
