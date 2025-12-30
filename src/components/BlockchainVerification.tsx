import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CheckCircle2, ExternalLink, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { apiClient } from "../services/api";
import { toast } from "sonner";

interface BlockchainVerificationProps {
  verified: boolean;
  txHash?: string | null;
  contractAddress?: string | null;
  network?: string;
  grievanceId?: string;
  onVerified?: (result: { verified: boolean; txHash?: string }) => void;
}

export function BlockchainVerification({
  verified: initialVerified,
  txHash: initialTxHash,
  contractAddress,
  network = "sepolia",
  grievanceId,
  onVerified,
}: BlockchainVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(initialVerified);
  const [txHash, setTxHash] = useState(initialTxHash);

  const getExplorerUrl = (hash: string) => {
    const baseUrl =
      network === "sepolia"
        ? "https://sepolia.etherscan.io"
        : network === "mainnet"
        ? "https://etherscan.io"
        : `https://${network}.etherscan.io`;
    return `${baseUrl}/tx/${hash}`;
  };

  const handleVerify = async () => {
    if (!grievanceId) {
      toast.error("Cannot verify: No grievance ID provided");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await apiClient.verifyGrievance(grievanceId);
      if (result.verified) {
        setVerified(true);
        if (result.txHash) {
          setTxHash(result.txHash);
        }
        toast.success("Grievance verified on blockchain!");
        onVerified?.(result);
      } else {
        // Show specific error message from backend
        const message = result.message || "Verification failed. Please try again later.";
        toast.error(message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  // Show verify button if we have a grievance ID but not verified yet
  if (!verified && !txHash && grievanceId) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-6 text-xs"
        onClick={handleVerify}
        disabled={isVerifying}
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <ShieldCheck className="w-3 h-3 mr-1" />
            Verify on Chain
          </>
        )}
      </Button>
    );
  }

  if (!verified && !txHash) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {verified && (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-300"
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Verified on Blockchain
        </Badge>
      )}

      {txHash && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => window.open(getExplorerUrl(txHash), "_blank")}
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          View on {network === "sepolia" ? "Etherscan" : "Explorer"}
        </Button>
      )}

      {contractAddress && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() =>
            window.open(
              `https://${network === "sepolia" ? "sepolia." : ""}etherscan.io/address/${contractAddress}`,
              "_blank"
            )
          }
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Contract
        </Button>
      )}
    </div>
  );
}


