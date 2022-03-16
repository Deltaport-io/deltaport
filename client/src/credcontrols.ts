export const getCredentials = () => {
    const rawAccounts = localStorage.getItem('accounts')!
    const accounts = JSON.parse(rawAccounts)
    if (accounts && accounts.token) {
      return accounts
    }
    return { token: false }
  }
  
  export const storeCredentials = (token: string) => {
    localStorage.setItem('accounts', JSON.stringify({ token }))
  }
  
  export const deleteCredentials = () => {
    localStorage.setItem('accounts', JSON.stringify({}))
  }
  