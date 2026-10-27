/**
 * ANILyfe Payout Service
 * Handles seller financial ledger, settlement balances, Nigerian bank accounts,
 * and payout withdrawal requests.
 * Real money movement will eventually be executed and validated server-side.
 */
(function() {
  const STORAGE_PREFIX = 'anilyfe_seller_payouts_';
  function storageKey(){ const u=window.currentUser?.(); const seller=u && window.sellerOf ? window.sellerOf(u.id) : null; return STORAGE_PREFIX + (seller?.id || 'anonymous'); }

  const NIGERIAN_BANKS = [
    { code: '058', name: 'Guaranty Trust Bank (GTBank)' },
    { code: '057', name: 'Zenith Bank' },
    { code: '044', name: 'Access Bank' },
    { code: '011', name: 'First Bank of Nigeria' },
    { code: '033', name: 'United Bank for Africa (UBA)' },
    { code: '039', name: 'Stanbic IBTC Bank' },
    { code: '50211', name: 'Kuda Microfinance Bank' },
    { code: '50515', name: 'Moniepoint MFB' },
    { code: '999992', name: 'OPay Digital Services' }
  ];

  function defaultPayouts() { return {availableBalance:0,pendingBalance:0,totalEarnings:0,totalWithdrawn:0,totalMarketplaceFees:0,totalRefundAdjustments:0,bankAccount:null,schedule:'',history:[],transactions:[]}; }

  function getStored() {
    try {
      const raw = localStorage.getItem(storageKey());
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const def = defaultPayouts();
    localStorage.setItem(storageKey(), JSON.stringify(def));
    return def;
  }

  const payoutService = {
    async getOverview() {
      await new Promise(r => setTimeout(r, 40));
      return getStored();
    },

    getNigerianBanks() {
      return NIGERIAN_BANKS;
    },

    async simulateVerifyAccount(bankCode, accountNumber) {
      await new Promise(r => setTimeout(r, 300));
      if (!accountNumber || accountNumber.length !== 10) {
        throw new Error('Nigerian NUBAN account numbers must be exactly 10 digits.');
      }
      const bank = NIGERIAN_BANKS.find(b => b.code === bankCode);
      return {
        verified: true,
        accountName: (window.currentUser && window.currentUser() ? window.currentUser().name : ''),
        accountNumber,
        bankName: bank ? bank.name : 'Verified Financial Institution'
      };
    },

    async updatePayoutAccount(accountDetails) {
      await new Promise(r => setTimeout(r, 80));
      const current = getStored();
      current.bankAccount = {
        ...current.bankAccount,
        ...accountDetails,
        verified: true
      };
      localStorage.setItem(storageKey(), JSON.stringify(current));
      window.dispatchEvent(new CustomEvent('anilyfe:payouts-updated'));
      return current.bankAccount;
    },

    async requestPayout(amount) {
      await new Promise(r => setTimeout(r, 100));
      const current = getStored();
      const numAmount = Number(amount);
      if (!current.bankAccount || !current.bankAccount.verified) throw new Error('Add and verify a payout bank account before requesting a payout.');

      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Please enter a valid payout amount.');
      }
      if (numAmount < 10000) {
        throw new Error('Minimum withdrawal amount on ANILyfe is ₦10,000.');
      }
      if (numAmount > current.availableBalance) {
        throw new Error(`Insufficient available balance (₦${current.availableBalance.toLocaleString('en-NG')} available).`);
      }

      current.availableBalance -= numAmount;
      current.totalWithdrawn += numAmount;

      const newPayout = {
        id: `PO-ANL-${Date.now().toString(36).toUpperCase()}`,
        amount: numAmount,
        bank: `${current.bankAccount.bankName} (••••${current.bankAccount.accountNumber.slice(-4)})`,
        status: 'Processing',
        reference: `PAY-TRX-${Date.now().toString(36).toUpperCase()}`,
        requestedAt: new Date().toISOString(),
        completedAt: null
      };

      current.history.unshift(newPayout);
      localStorage.setItem(storageKey(), JSON.stringify(current));

      // Also trigger a notification
      if (window.notificationService) {
        window.notificationService.addNotification({
          category: 'financial',
          type: 'payout_requested',
          title: 'Payout Request Initiated',
          message: `Your request to withdraw ₦${numAmount.toLocaleString('en-NG')} has been queued for bank transfer processing.`,
          link: '#/seller/earnings'
        });
      }

      window.dispatchEvent(new CustomEvent('anilyfe:payouts-updated'));
      return newPayout;
    }
  };

  window.payoutService = payoutService;
})();
