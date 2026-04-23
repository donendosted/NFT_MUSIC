import axios from 'axios';
import FormData from 'form-data';

const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_JWT = process.env.PINATA_JWT;

export async function uploadToPinata(fileBuffer, filename, metadata = {}) {
  if (!PINATA_JWT) {
    throw new Error('PINATA_JWT not configured');
  }

  const formData = new FormData();
  formData.append('file', fileBuffer, filename);

  const pinataMetadata = JSON.stringify({
    name: filename,
    keyvalues: metadata,
  });
  formData.append('pinataMetadata', pinataMetadata);

  const res = await axios.post(`${PINATA_API_URL}/pinning/pinFileToIPFS`, formData, {
    maxBodyLength: 'Infinity',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
      Authorization: `Bearer ${PINATA_JWT}`,
    },
  });

  return {
    ipfsHash: res.data.IpfsHash,
    url: `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`,
  };
}