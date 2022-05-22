import fs from 'fs'
import { authz } from './authz.js'
import fcl from '@onflow/fcl'
import {
  nodeUrl,
  accountAddr,
  paths,
  FLOWTokenAddr,
  flowFungibleAddr,
  KIBBLETokenAddr,
  FUSDTokenAddr,
  flowNonFungibleAddr,
  alchemyKey,
} from '../config/constants.js'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const { setup, scripts, transactions } = paths

export const fclInit = () => {
  fcl
    .config()
    .put('accessNode.api', nodeUrl)
    .put('0xNonFungibleToken', flowNonFungibleAddr)
    .put('0xFungibleToken', flowFungibleAddr)
    .put('0xFlowToken', FLOWTokenAddr)
    .put('0xKibble', KIBBLETokenAddr)
    .put('0xFUSD', FUSDTokenAddr)
    .put('grpc.metadata', { api_key: alchemyKey })
}

export const sendTrx = async (CODE, args, auth = null, limit = 9999) => {
  const authFunc = auth || authz
  const txId = await fcl
    .send([
      fcl.transaction(CODE),
      fcl.args(args),
      fcl.proposer(authFunc),
      fcl.payer(authFunc),
      fcl.authorizations([authFunc]),
      fcl.limit(limit),
    ])
    .then(fcl.decode)

  return txId
}

export const execScript = async (script, args = []) => {
  return await fcl.send([fcl.script`${script}`, fcl.args(args)]).then(fcl.decode)
}

export const buildAndSendTrx = async (key, args = [], authFunc = null, limit = 9999) => {
  try {
    const trxScript = await readCode(transactions[key])
    const trxId = await sendTrx(trxScript, args, authFunc, limit)
    const txStatus = await fcl.tx(trxId).onceSealed()
    return txStatus
  } catch (error) {
    console.log(error)
    return null
  }
}

export const buildAndExecScript = async (key, args = []) => {
  const script = await readCode(scripts[key])
  const result = await execScript(script, args)
  return result
}

export const readCode = async (path) => {
  let data = fs.readFileSync(resolve(__dirname, path), 'utf-8')
  if (data.indexOf('(0xStaking)') > 0) {
    data = data.replace('(0xStaking)', `(${accountAddr})`)
  }
  return data
}

export const sleep = async (time) => {
  return new Promise((resolve) => setTimeout(resolve, time))
}

export default {}
