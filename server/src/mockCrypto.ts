import models from './models'
import BigNumber from 'bignumber.js'

const BNZERO = new BigNumber(0)

export class mockCrypto {

  wallets: any = {}
  globalBalances: any = {}

  private mockTransaction = (address: string = '') => {
    return {
      "transactionHash": "0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b",
      "transactionIndex": 0,
      "blockHash": "0xef95f2f1ed3ca60b048b4bf67cde2195961e0bba6f70bcbea9a2c4e133e34b46",
      "blockNumber": 0,
      "contractAddress": address,
      "cumulativeGasUsed": 323333,
      "gasUsed": 32333,
    }
  }

  private getWalletTokenBalance = (address: string, token: string) => {
    if (this.globalBalances[address] === undefined) {
      this.globalBalances[address] = {}
    }
    if (this.globalBalances[address][token] === undefined) {
      this.globalBalances[address][token] = new BigNumber(0)
    }
    return this.globalBalances[address][token]
  }

  wallet = async (wallet: any, balances: any = undefined) => {
    if (this.wallets[wallet.name]) {
      return this.wallets[wallet.name]
    }
    if (balances) {
      for (const balance of balances) {
        let localBalance: BigNumber = this.getWalletTokenBalance(wallet.address, balance.token)
        this.globalBalances[wallet.address][balance.token] = localBalance.plus(new BigNumber(balance.value))
      }
    }
    this.wallets[wallet.name] = {
      getBalance: async (address: string = undefined) => {
        return this.getWalletTokenBalance(address ? address : wallet.address, 'ether')
      },
      transferEther: async (toAddress: string, amount: string) => {
        const fromBalance: BigNumber = this.getWalletTokenBalance(wallet.address, 'ether')
        const bnamount = new BigNumber(amount)
        const newAmount = fromBalance.minus(bnamount)
        if (newAmount.lt(BNZERO)) {
          throw new Error('No enough ether')
        }
        this.globalBalances[wallet.address]['ether'] = newAmount
        const toBalance: BigNumber = this.getWalletTokenBalance(toAddress, 'ether')
        this.globalBalances[toAddress]['ether'] = toBalance.plus(bnamount)
        return this.mockTransaction()
      },
      token: async (tokenAddress: string) => {
        return {
          getBalance: async () => {
            return this.getWalletTokenBalance(wallet.address, tokenAddress)
          },
          transfer: async (toAddress: string, amount: string) => {
            const bnamount = new BigNumber(amount)
            const fromBalance: BigNumber = this.getWalletTokenBalance(wallet.address, tokenAddress)
            const newAmount = fromBalance.minus(bnamount)
            if (newAmount.lt(BNZERO)) {
              throw new Error('No enough tokens')
            }
            this.globalBalances[wallet.address][tokenAddress] = newAmount
            const toBalance: BigNumber = this.getWalletTokenBalance(toAddress, tokenAddress)
            this.globalBalances[toAddress][tokenAddress] = toBalance.plus(bnamount)
            return this.mockTransaction(tokenAddress)
          }
        }
      }
    }
    return this.wallets[wallet.name]
  }
}