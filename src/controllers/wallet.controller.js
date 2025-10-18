const Wallet = require('../models/wallet.model');
const Transaction = require('../models/transaction.model');
const crypto = require('crypto');

// Get wallet balance
exports.getBalance = async (req, res) => {
  try {
    const userId = req.user._id;

    let personalWallet = await Wallet.findOne({
      owner: userId,
      type: 'personal'
    });

    let sponsoredWallet = await Wallet.findOne({
      owner: userId,
      type: 'sponsored'
    });

    // Create wallets if they don't exist
    if (!personalWallet) {
      personalWallet = await Wallet.create({
        walletId: `WALLET-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
        owner: userId,
        type: 'personal',
        balance: {
          available: 0,
          pending: 0,
          reserved: 0,
          currency: 'USD'
        }
      });
    }

    if (!sponsoredWallet) {
      sponsoredWallet = await Wallet.create({
        walletId: `WALLET-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
        owner: userId,
        type: 'sponsored',
        balance: {
          available: 0,
          pending: 0,
          reserved: 0,
          currency: 'USD'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        personal: {
          walletId: personalWallet.walletId,
          balance: personalWallet.balance.available,
          pending: personalWallet.balance.pending,
          reserved: personalWallet.balance.reserved,
          currency: personalWallet.balance.currency
        },
        sponsored: {
          walletId: sponsoredWallet.walletId,
          balance: sponsoredWallet.balance.available,
          pending: sponsoredWallet.balance.pending,
          reserved: sponsoredWallet.balance.reserved,
          currency: sponsoredWallet.balance.currency
        }
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get wallet balance',
      error: error.message
    });
  }
};

// Add funds to wallet
exports.addFunds = async (req, res) => {
  try {
    const { amount, walletType = 'personal', paymentMethod } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    let wallet = await Wallet.findOne({
      owner: userId,
      type: walletType
    });

    if (!wallet) {
      wallet = await Wallet.create({
        walletId: `WALLET-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
        owner: userId,
        type: walletType,
        balance: {
          available: 0,
          pending: 0,
          reserved: 0,
          currency: 'USD'
        }
      });
    }

    // Update wallet balance
    wallet.balance.available += parseFloat(amount);
    await wallet.save();

    // Create transaction record
    await Transaction.create({
      transactionId: `TXN-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
      user: userId,
      wallet: wallet._id,
      type: 'deposit',
      amount: parseFloat(amount),
      currency: wallet.balance.currency,
      description: `Funds added via ${paymentMethod || 'payment'}`,
      status: 'completed',
      paymentMethod: {
        type: paymentMethod || 'card'
      }
    });

    res.status(200).json({
      success: true,
      data: {
        walletId: wallet.walletId,
        newBalance: wallet.balance.available,
        walletType: wallet.type,
        currency: wallet.balance.currency
      },
      message: 'Funds added successfully'
    });
  } catch (error) {
    console.error('Add funds error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to add funds',
      error: error.message
    });
  }
};
