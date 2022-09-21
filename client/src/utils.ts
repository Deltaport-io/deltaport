import { ethers } from "ethers"

export const getDisplayBalance = (amount: string, decimal: string) => {
  try {
    return ethers.utils.formatUnits(amount, decimal).toString()
  } catch (e) {
    return ''
  }
}

export const fromDisplayBalance = (amount: string, decimal: string) => {
  try {
    return ethers.utils.parseUnits(amount, decimal).toString()
  } catch (e) {
    return ''
  }
}

export const getPromoted = () => {
  const rawPromoted = JSON.parse(localStorage.getItem('promoted')!)
  let promoted: any[] = []
  if (rawPromoted){
    promoted = rawPromoted.promopairs
  }
  return promoted
}

export const getPromotedExchanges = () => {
  const rawPromoted = JSON.parse(localStorage.getItem('promoted')!)
  let promoted: any[] = []
  if (rawPromoted){
    promoted = rawPromoted.promoexchanges
  }
  return promoted
}

export const promotedToken = (arr1: any[]) => {
  const promoted = getPromoted()
  return arr1.some(item => promoted.includes(item.symbol))
}

export const truncate = (text: string, max: number) => {
  return text.length > max ? `${text.substring(0, max)}...` : text;
}