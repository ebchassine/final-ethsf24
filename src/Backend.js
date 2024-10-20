import { WeaveHelper, WeaveAPI } from "./weaveapi";
import LOCAL_STORAGE from "./LocalStorage";
import {APP_CONFIG} from "./AppConfig";
import { v4 } from "uuid"

export const getNodeApi = async () => {
  const state = LOCAL_STORAGE.loadState();
  let backend = state.backend;

  if (!backend?.pvk || state.signature !== backend?.credentials?.sig) {
    const [pub, pvk] = WeaveHelper.generateKeys();
    console.log("Generated Public Key: ", pub);

    const node = APP_CONFIG.node;
    const organization = APP_CONFIG.organization;
    const encrypted = node.startsWith("http://");

    const chain = "skale";
    const wallet = state.wallet;
    const credentials = state.signature ? {
      account: chain + ":" + wallet,
      sig: state.signature,
      template: "*",
      role: "*",
    } : null;

    backend = {
      seed: APP_CONFIG.seed,
      pub,
      pvk,
      apiCfg: WeaveHelper.getConfig(node, pub, pvk, encrypted),
      credentials
    }

    LOCAL_STORAGE.saveState({...state, backend})
  }

  const apiConfig = {
    publicKey: backend?.pub,
    publicKeyFile: null,
    privateKey: backend?.pvk,
    seed: backend?.seed,
    http: backend?.apiCfg,
    credentials: backend?.credentials,
  }

  apiConfig.encrypted = APP_CONFIG.node.startsWith("http://");

  console.log(apiConfig);
  const nodeApi = new WeaveAPI().create(apiConfig.http);
  if (nodeApi == null) return null;

  await nodeApi.init();
  const pong = await nodeApi.ping();
  console.log(pong);
  return nodeApi;
};

export const getSession = async (nodeApi, organization) => {
  const account = nodeApi.getClientPublicKey();
  const scope = "*";
  let state = LOCAL_STORAGE.loadState();
  let backend = state.backend;
  const cred = null; //backend?.credentials;
  console.log("Auth cred")
  console.log(account)
  console.log(backend.credentials)
  const session = await nodeApi.login(organization, account, scope, cred);

  const pubKey = (await nodeApi.publicKey())?.data;
  state = {...state, nodePubKey: pubKey};
  LOCAL_STORAGE.saveState(state);

  return session;
};

export const weaveReadFiles = async (organization) => {
  try {
    const nodeApi = await getNodeApi();
    if (!nodeApi) {
      console.log("Error creating node api");
      return "Error creating node api";
    }

    const scope = "vault";
    const session = await getSession(nodeApi, organization);
    const collapsing = null
    const filter = new WeaveHelper.Filter(null, null, null, collapsing, null, null)
    return nodeApi.read(session, scope, "files", filter, WeaveHelper.Options.READ_DEFAULT_NO_CHAIN);
  } catch (e) {
    console.log("Error loading " + e);
    return "Error loading " + e;
  }
}

export const weaveReadWallets = async (organization) => {
  try {
    const nodeApi = await getNodeApi();
    if (!nodeApi) {
      console.log("Error creating node api");
      return "Error creating node api";
    }

    const scope = "vault";
    const session = await getSession(nodeApi, organization);
    const collapsing = [ 'wallet' ];
    const filter = new WeaveHelper.Filter(null, null, null, collapsing, null, null)
    return nodeApi.read(session, scope, "wallets", filter, WeaveHelper.Options.READ_DEFAULT_NO_CHAIN);
  } catch (e) {
    console.log("Error loading " + e);
    return "Error loading " + e;
  }
}

export const weaveStoreWallet = async (organization, wallet, signature) => {
  try {
    const nodeApi = await getNodeApi();
    if (!nodeApi) {
      console.log("Error creating node api");
      return "Error creating node api";
    }

    const record = [
      null, // id, autofilled
      null, // timestamp, autofilled
      null, // writer, autofilled
      null, // integrity signature, autofilled
      wallet,
      signature
    ];

    const scope = "vault";
    const session = await getSession(nodeApi, organization);
    const records = new WeaveHelper.Records("wallets", [record]);
    return nodeApi.write(
        session,
        scope,
        records,
        WeaveHelper.Options.WRITE_DEFAULT
    );
  } catch (e) {
    console.log("Error loading " + e);
    return "Error loading " + e;
  }
}

export const weaveSendFile = async (organization, name, type, recipient, content, iv) => {
  try {
    const nodeApi = await getNodeApi();
    if (!nodeApi) {
      console.log("Error creating node api");
      return "Error creating node api";
    }

    const did = "did:ethsf24:" + v4().replaceAll("-", "");
    const record = [
      null, // id, autofilled
      null, // timestamp, autofilled
      null, // writer, autofilled
      null, // integrity signature, autofilled
      "*", //access
      did,
      name,
      type,
      recipient,
      content,
      iv
    ];

    const scope = "vault";
    const session = await getSession(nodeApi, organization);
    const records = new WeaveHelper.Records("files", [record]);
    return nodeApi.write(
        session,
        scope,
        records,
        WeaveHelper.Options.WRITE_DEFAULT
    );
  } catch (e) {
    console.log("Error loading " + e);
    return "Error loading " + e;
  }
}