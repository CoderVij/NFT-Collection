import { Contract, providers, utils } from "ethers";
import { getJsonWalletAddress } from "ethers/lib/utils";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home()
{
  const [walletConnected, setWalletConnected] = useState(false);
  const [preSaleStarted, setPreSaleStarted] = useState(false);
  const [preSaleEnded, setPreSaleEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [tokenIdsMinted, setTokenIdsMinted] = useState(0);
  const web3ModalRef = useRef();


  const getProviderOrSigner = async (needSigner = false)=>
  {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const {chainId} = await Web3Provider.getNetwork();
    if(chainId !== 5)
    {
      window.alert("Change network to goerli");
      throw new Error("Change network to goerli");
    }

    if(needSigner)
    {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  }

  const presaleMint = async ()=>
  {
    try
    {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      const tx = await nftContract.presaleMint({
        value:utils.parseEther("0.01"),
      });

      setLoading(true);

      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Freakout NFT!");
    }
    catch(error)
    {
      console.log(error);
    }
  };


  const publicMint = async ()=>
  {
    try
    {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      const tx = await nftContract.mint({
        value:utils.parseEther("0.01"),
      });

      setLoading(true);

      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Freakout NFT!");
    }
    catch(error)
    {
      console.error(error);
    }
  };

  const connectWallet = async ()=>
  {
    try
    {
      await getProviderOrSigner();
      setWalletConnected(true);
    }
    catch(error)
    {
      console.error(error);
    }
    
  };

  const startPresale = async ()=>
  {
    try
    {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      const tx = await nftContract.startPresale();

      setLoading(true);

      await tx.wait();
      setLoading(false);
      
      await checkIfPresaleStarted(); 
    }
    catch(error)
    {
      console.error(error);
    }
  };


  const checkIfPresaleStarted = async ()=>
  {
    try
    {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const _presaleStarted = await nftContract.preSaleStarted();

      if(!_presaleStarted)
      {
        await getOwner();
      }
      setPreSaleStarted(_presaleStarted);
      return _presaleStarted;
    }
    catch(error)
    {
      console.error(error);
      return false;
    }
  };

  const checkIfPresaleEnded = async ()=>
  {
    try
    {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const _presaleEnded = await nftContract.preSaleEnded();

      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));

      if(hasEnded)
      {
        setPreSaleEnded(true);
      }
      else{
        setPreSaleEnded(false);
      }

      return hasEnded;
    }
    catch(error)
    {
      console.log(error);
      return false;
    }
  };

  const getOwner = async ()=>
  {
     try
     {
        const provider = await getProviderOrSigner();
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

        const owner = await nftContract.owner()
        const signer = await getProviderOrSigner(true);
        const address = await signer.getAddress();

        if(address.toLowerCase() === owner.toLowerCase())
        {
          setIsOwner(true);
        }
      }
     catch(error)
     {
      console.error(error);
     }
  };

  const getTokenIdsMinted = async ()=>
  {
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const _tokenIds = await nftContract.tokenIds();
      setTokenIdsMinted(_tokenIds.toString());
    }
    catch(error)
    {
      console.error(error);
    }
  };

  useEffect(() =>
  {
    if(!walletConnected)
    {

      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      const _presaleStarted = checkIfPresaleStarted();
      if (_presaleStarted) 
      {
        checkIfPresaleEnded();
      }
      getTokenIdsMinted();
    

    const presaleEndedInterval = setInterval(async function () {
      const _presaleStarted = await checkIfPresaleStarted();
      if (_presaleStarted) {
        const _presaleEnded = await checkIfPresaleEnded();
        if (_presaleEnded) {
          clearInterval(presaleEndedInterval);
        }
      }
    }, 5 * 1000);

      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  },[walletConnected])



  const renderButton = () => 
  {

    if (!walletConnected) 
    {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    if (loading) 
    {
      return <button className={styles.button}>Loading...</button>;
    }


    if (isOwner && !preSaleStarted) 
    {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale!
        </button>
      );
    }


    if (!preSaleStarted) 
    {
      return (
        <div>
          <div className={styles.description}>Presale hasnt started!</div>
        </div>
      );
    }


    if (preSaleStarted && !preSaleEnded) 
    {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a Crypto
            Dev 🥳
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }


    if (preSaleStarted && preSaleEnded) 
    {
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint 🚀
        </button>
      );
    }
  };


  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Simple Human Talks!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Simple Human Talks
      </footer>
    </div>
  );
}