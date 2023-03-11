import React, { useState } from "react";
import Image from "next/image";
import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";
import { ToastContainer, toast } from "react-toastify";
import { useRouter } from "next/router";
import "react-toastify/dist/ReactToastify.css";
import { Biconomy } from "@biconomy/mexa";
import { ExternalProvider } from "@ethersproject/providers";
import soulboundAbi from "../../../provider/abi/soulbound.json";
import { ethers } from "ethers";
function Landing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const soulbound = "0xa6F9B0194CaebC7E0845741AA0bEAbBaE10b657b";
  const { address } = useAccount();
  const { data, write } = useContractWrite({
    mode: "recklesslyUnprepared",
    address: "0xa6F9B0194CaebC7E0845741AA0bEAbBaE10b657b",
    abi: [
      {
        inputs: [],
        name: "certMint",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    functionName: "certMint",
    onError(err: any) {
      console.log("error:", err?.data);
      toast.error(err?.data.message);
    },
  });

  const { isLoading } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess(data) {
      router.push(`https://testnets.opensea.io/account`);
    },
    onError(err) {
      // console.log(err.message);
      toast.error(err?.message);
    },
  });

  // async function handleGaslessTxn() {
  //   if (typeof window.ethereum !== 'undefined') {
  //     const biconomy = new Biconomy(
  //       window.ethereum as ExternalProvider,
  //       {
  //         apiKey: process.env.NEXT_PUBLIC_BICONOMY_API_KEY as string,
  //         debug: true,
  //         contractAddresses: [soulbound]
  //       }
  //     );
  //     const provider = await biconomy.provider;

  //     const contractInstance = new ethers.Contract(
  //       soulbound,
  //       soulboundAbi,
  //       biconomy.ethersProvider
  //     );
  //     await biconomy.init();

  //     const { data } = await contractInstance.populateTransaction.certMint()

  //     let txParams = {
  //       data: data,
  //       to: soulbound,
  //       from: address,
  //       signatureType: "EIP712_SIGN",
  //     };
  //     // @ts-ignore
  //     await provider.send("eth_sendTransaction", [txParams]);
  //   }
  // }

  async function handleGaslessTxn() {
    try {
      setLoading(true);
      if (typeof window.ethereum !== "undefined") {
        const biconomy = new Biconomy(window.ethereum as ExternalProvider, {
          apiKey: process.env.NEXT_PUBLIC_BICONOMY_API_KEY as string,
          debug: true,
          contractAddresses: [soulbound],
        });
        const provider = await biconomy.provider;

        const contractInstance = new ethers.Contract(
          soulbound,
          soulboundAbi,
          biconomy.ethersProvider
        );
        await biconomy.init();

        const { data } = await contractInstance.populateTransaction.certMint();

        let txParams = {
          data: data,
          to: soulbound,
          from: address,
          signatureType: "EIP712_SIGN",
        };
        // @ts-ignore
        const tx: any = await provider.send("eth_sendTransaction", [txParams]);
        console.log("response:", tx)
        if (tx.name == "Error") {
          toast.error(tx.reason);
        } else {
          toast.success("successfully minted");
          router.push(`https://testnets.opensea.io/account`);
        }

        setLoading(false);
      }
    } catch (error: any) {
      setLoading(false);
      setError(
        error.message || "An error occurred while processing your request."
      );
    }
  }

  const handleTnx = async () => {
    try {
      const userProvider = new ethers.providers.Web3Provider(
        window.ethereum as ExternalProvider
      );

      const signer = userProvider.getSigner();
      const from = await signer.getAddress();
      const balance = await userProvider.getBalance(from);

      const canSendTx = balance.gt(1e15);
      if (canSendTx) {
        return write?.();
      } else {
        return handleGaslessTxn();
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <>
      <ToastContainer />
      <section className="container mx-auto">
        <div className="grid items-center md:grid-cols-2 md:gap-x-12 lg:grid-cols-2 lg:gap-x-12 mb-24">
          <div className="p-2 md:p-6 lg:p-0 text-center md:text-left lg:text-left">
            <h2 className="text-gray-200 md:text-medium md:leading-medium lg:text-large lg:leading-large font-black">
              Grab your
              <br /> Soul-bound certificate{" "}
            </h2>
            <p className="text-gray-200 md:text-xs lg:text-small lg:leading-small my-4">
              This is only open to the approved addresses and
              <br /> can’t be transferred out once minted.
            </p>
            <button
              disabled={isLoading || loading}
              onClick={handleTnx}
              className="bg-[#3BD6B2] text-gray-200  px-24 py-4 rounded-full"
            >
              {isLoading || loading ? "Minting" : "Mint Certificate"}
            </button>
          </div>

          <div>
            <Image
              src="/desktop.png"
              width={539}
              height={573}
              alt="desktop__svg"
            />
          </div>
        </div>
      </section>
    </>
  );
}

export default Landing;
