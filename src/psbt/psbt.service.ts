import { BadRequestException, Injectable } from '@nestjs/common';
import { WalletTypes } from '@src/user/user.entity';
import axios from 'axios';
import { type Network } from 'bitcoinjs-lib';
import { testnet } from 'bitcoinjs-lib/src/networks';
import * as Bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ConfigService } from '@nestjs/config';

Bitcoin.initEccLib(ecc);

export interface IInscription {
  address: string;
  inscriptionId: string;
  inscriptionNumber: number;
  output: string;
  outputValue: number;
}

interface IUtxo {
  txid: string;
  vout: number;
  value: number;
}

@Injectable()
export class PsbtService {
  private feePercent: number;
  private adminAddress: string;

  constructor(private configService: ConfigService) {
    this.feePercent = this.configService.get('psbtConfig.feePercent');
    this.adminAddress = this.configService.get('psbtConfig.adminAddress');
  }

  async generateBuyNowPsbt({
    ownerPubkey,
    buyerPubkey,
    walletType,
    recipient,
    network,
    inscriptionId,
    price,
  }: {
    ownerPubkey: string;
    buyerPubkey: string;
    walletType: WalletTypes;
    recipient: string;
    network: Network;
    inscriptionId: string;
    price: number;
  }): Promise<{ psbt: string; inputCount: number }> {
    const buyerHexedPubkey = Buffer.from(buyerPubkey, 'hex');
    let buyerAddress, buyerOutput;
    if (walletType === WalletTypes.HIRO) {
      const { address, output } = Bitcoin.payments.p2wpkh({
        pubkey: buyerHexedPubkey,
        network: network,
      });
      buyerAddress = address;
      buyerOutput = output;
    } else if (walletType === WalletTypes.UNISAT) {
      const { address, output } = Bitcoin.payments.p2tr({
        internalPubkey: buyerHexedPubkey.slice(1, 33),
        network: network,
      });
      buyerAddress = address;
      buyerOutput = output;
    } else if (walletType === WalletTypes.XVERSE) {
      const p2wpkh = Bitcoin.payments.p2wpkh({
        pubkey: buyerHexedPubkey,
        network: network,
      });
      const { address, redeem } = Bitcoin.payments.p2sh({
        redeem: p2wpkh,
        network: network,
      });
      buyerAddress = address;
      buyerOutput = redeem?.output;
    }

    const ownerHexedPubkey = Buffer.from(ownerPubkey, 'hex');
    const { address: ownerAddress, output: ownerOutput } =
      Bitcoin.payments.p2tr({
        internalPubkey: ownerHexedPubkey.slice(1, 33),
        network: network,
      });

    const psbt = new Bitcoin.Psbt({ network: network });
    const inscriptions = await this.getInscriptions(ownerAddress, network);
    const inscription = inscriptions.find(
      (inscription) => inscription.inscriptionId === inscriptionId,
    );

    if (!inscription)
      throw new BadRequestException(
        'Can not find inscription id in owner address',
      );

    const [inscriptionHash, inscriptionIndex] = inscription.output.split(
      ':',
    ) as [string, string];

    const utxos = await this.getTransferableUtxos(
      buyerAddress as string,
      network,
    );
    const feeRate = await this.getFeeRate(network);

    psbt.addInputs([
      {
        hash: inscriptionHash,
        index: Number(inscriptionIndex),
        witnessUtxo: {
          value: inscription.outputValue,
          script: ownerOutput,
        },
        tapInternalKey: ownerHexedPubkey.slice(1, 33),
      },
    ]);

    let amount = 0;
    if (walletType === WalletTypes.HIRO) {
      for (const utxo of utxos) {
        if (amount < price + (psbt.inputCount + 4) * 60 * feeRate) {
          amount += utxo.value;
          psbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
              value: utxo.value,
              script: buyerOutput as Buffer,
            },
          });
        }
      }
    } else if (walletType === WalletTypes.UNISAT) {
      for (const utxo of utxos) {
        if (amount < price + (psbt.inputCount + 4) * 60 * feeRate) {
          amount += utxo.value;
          psbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
              value: utxo.value,
              script: buyerOutput as Buffer,
            },
            tapInternalKey: buyerHexedPubkey.slice(1, 33),
          });
        }
      }
    } else if (walletType === WalletTypes.XVERSE) {
      for (const utxo of utxos) {
        if (amount < price + (psbt.inputCount + 4) * 60 * feeRate) {
          amount += utxo.value;
          const { data } = await axios.get(
            `https://mempool.space/${
              network === testnet ? 'testnet' : ''
            }/api/tx/${utxo.txid}/hex`,
          );
          psbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            redeemScript: buyerOutput,
            nonWitnessUtxo: Buffer.from(data, 'hex'),
          });
        }
      }
    }

    if (amount < price + (psbt.inputCount + 4) * 60 * feeRate)
      throw new BadRequestException(
        "You don't have enough bitcoin in your wallet",
      );

    psbt.addOutputs([
      {
        value: inscription.outputValue,
        address: recipient,
      },
      {
        value: (price * this.feePercent) / 100,
        address: this.adminAddress,
      },
      {
        value: (price * (100 - this.feePercent)) / 100,
        address: ownerAddress,
      },
      {
        value: amount - (price + (psbt.inputCount + 4) * 60 * feeRate),
        address: buyerAddress,
      },
    ]);

    return { psbt: psbt.toHex(), inputCount: psbt.inputCount};
  }

  async getInscriptions(
    address: string,
    network: Network,
  ): Promise<IInscription[]> {
    const url = `https://unisat.io/${
      network === testnet ? 'testnet' : ''
    }/wallet-api-v4/address/inscriptions?address=${address}&cursor=0&size=100
          `;
    const headers = {
      'X-Address': address,
      'X-Channel': 'store',
      'X-Client': 'UniSat Wallet',
      'X-Udid': '1SRcnclB8Ck3',
      'X-Version': '1.1.21',
    };

    const res = await fetch(url, { headers });
    const inscriptionDatas = await res.json();

    const inscriptions: IInscription[] = [];
    inscriptionDatas.result.list.forEach((inscriptionData: any) => {
      inscriptions.push({
        address: inscriptionData.address,
        inscriptionId: inscriptionData.inscriptionId,
        inscriptionNumber: inscriptionData.inscriptionNumber,
        output: inscriptionData.output,
        outputValue: inscriptionData.outputValue,
      });
    });

    return inscriptions;
  }

  async getTransferableUtxos(
    address: string,
    network: Network,
  ): Promise<IUtxo[]> {
    const transferableUtxos: IUtxo[] = [];

    const utxos = await this.getUtxos(address, network);
    const inscriptions = await this.getInscriptions(address, network);

    utxos.forEach((utxo) => {
      const inscriptionUtxo = inscriptions.find((inscription) => {
        return inscription.output.includes(utxo.txid);
      });
      if (!inscriptionUtxo) transferableUtxos.push(utxo);
      else if (utxo.vout !== 0) transferableUtxos.push(utxo);
    });

    return transferableUtxos;
  }

  async getUtxos(address: string, network: Network): Promise<IUtxo[]> {
    const url = `https://mempool.space/${
      network === testnet ? 'testnet' : ''
    }/api/address/${address}/utxo`;
    const res = await axios.get(url);
    const utxos: IUtxo[] = [];
    res.data.forEach((utxoData: any) => {
      utxos.push({
        txid: utxoData.txid,
        vout: utxoData.vout,
        value: utxoData.value,
      });
    });
    return utxos;
  }

  async getFeeRate(network: Network): Promise<number> {
    const url = `https://mempool.space/${
      network === testnet ? 'testnet' : ''
    }/api/v1/fees/recommended`;
    const res = await axios.get(url);
    return res.data.halfHourFee;
  }

  convertHexedToBase64(hexedPsbt: string): string {
    const psbt = Bitcoin.Psbt.fromHex(hexedPsbt);
    return psbt.toBase64();
  }
}
