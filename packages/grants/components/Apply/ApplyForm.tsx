import { Web3Provider } from "@ethersproject/providers";
import { BeneficiaryApplication } from "helper/types";
import { formatAndRoundBigNumber, getBytes32FromIpfsHash, IpfsClient } from "@popcorn/utils";
import { useWeb3React } from "@web3-react/core";
import GeneralInformation from "components/Apply/GeneralInformation";
import ImpactReports from "components/Apply/ImpactReports";
import ProofsForm from "components/Apply/ProofsForm";
import VisualContent from "components/Apply/VisualContent";
import Button from "components/CommonComponents/Button";
import { connectors } from "context/Web3/connector";
import { ContractsContext } from "context/Web3/contracts";
import { BigNumber, ethers } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import inputExists, { isValidEmail } from "utils/isValidInput";
import { setDualActionModal, setSingleActionModal } from "../../context/actions";
import { store } from "../../context/store";

export enum FormSteps {
  GENERAL_INFORMATION,
  PROOFS,
  IMPACT_REPORTS,
  VISUAL_CONTENT,
}
interface ApplyFormProps {
  onPrevActiveForm: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  onNextActiveForm: Function;
  activeForm: FormSteps;
  form: [formData: BeneficiaryApplication, setFormData: React.Dispatch<BeneficiaryApplication>];
}

const ApplyForm: React.FC<ApplyFormProps> = ({ form, activeForm, onNextActiveForm, onPrevActiveForm }) => {
  const { library, account, activate, active } = useWeb3React<Web3Provider>();
  const { dispatch } = useContext(store);
  const { contracts } = useContext(ContractsContext);
  const router = useRouter();
  const [formData, setFormData] = form;
  const [errorList, setErrorList] = useState<Array<string>>([]);
  const [showErrors, setShowErrors] = useState<boolean>(false);
  const [proposalBond, setProposalBond] = useState<BigNumber>();
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    if (contracts) {
      getProposalBond().then((proposalBond) => setProposalBond(proposalBond));
    }
  }, [contracts]);

  const errorMessages = {
    orgNameError: "Organization Name is Required",
    ethAddressError: "Your ETH Address is not valid",
    projectNameError: "Title of Application is Required",
    orgMissionError: "Organization Mission is Required",
    emailError: "Email Address is not valid",
    proofOfOwnershipError: "Proof of Ownership URL is Required",
  };

  const success = () => toast.success("Successful upload to IPFS");
  const loading = () => toast.loading("Uploading to IPFS...");

  const checkPreConditions = async (): Promise<boolean> => {
    if (!contracts) {
      return false;
    }
    if (!account) {
      activate(connectors.Injected);
    }
    const balance = await contracts.pop.balanceOf(account);
    if (proposalBond.gt(balance)) {
      dispatch(
        setSingleActionModal({
          content: `In order to create a proposal you need to post a Bond of ${formatAndRoundBigNumber(
            proposalBond,
            18,
          )} POP`,
          title: "You need more POP",
          visible: true,
          type: "error",
          onConfirm: {
            label: "Close",
            onClick: () => {
              dispatch(setSingleActionModal(false));
            },
          },
        }),
      );
      return false;
    }
    return true;
  };

  const uploadJsonToIpfs = async (submissionData: BeneficiaryApplication): Promise<void> => {
    setUploading(true);
    if (await checkPreConditions()) {
      loading();
      try {
        const cid = await IpfsClient.add(submissionData);
        toast.dismiss();
        await (
          await contracts.pop
            .connect(library.getSigner())
            .approve(contracts.beneficiaryGovernance.address, proposalBond)
        ).wait();

        await contracts.beneficiaryGovernance
          .connect(library.getSigner())
          .createProposal(submissionData.beneficiaryAddress, ethers.utils.id("World"), cid, 0);
      } catch (error) {
        dispatch(setDualActionModal(false));
        dispatch(
          setSingleActionModal({
            title: "Error ",
            content: error?.data?.message || error?.message || error,
            onConfirm: {
              label: "Close",
              onClick: () => {
                setUploading(false);
                dispatch(setSingleActionModal(false));
              },
            },
            type: "error",
          }),
        );
        setUploading(false);
        return;
      }
      success();
      dispatch(setDualActionModal(false));
      congratsModal();
    }
    setUploading(false);
  };

  const getProposalBond = async (): Promise<BigNumber> => {
    const proposalDefaultConfigurations = await contracts?.beneficiaryGovernance?.DefaultConfigurations();
    return proposalDefaultConfigurations?.proposalBond;
  };

  const openModal = () => {
    const icon = <img src="/images/submitFormModalIcon.svg" alt="Submit Modal Icon" className="w-32 h-32" />;
    dispatch(
      setDualActionModal({
        title: "Submit Application",
        content: `By confirming the proposal submission, you commit to locking 2000 POP for the duration of the proposal process.
				If the nomination does not pass, the token that were locked at the time of submission will be kept in the contract. After a successful nomination, the tokens will be claimable by nominating user.`,
        onConfirm: {
          label: "Lock & Submit",
          onClick: () => uploadJsonToIpfs(formData),
        },
        onDismiss: {
          label: "Cancel",
          onClick: () => {
            setUploading(false);
            dispatch(setDualActionModal(false));
          },
        },
        icon,
      }),
    );
  };

  const congratsModal = () => {
    const image = <img src="/images/confetti.svg" alt="Confetti image" className="w-28 h-16" />;
    dispatch(
      setSingleActionModal({
        title: "Congratulations ",
        content: `The application for becoming an eligible beneficiary has been submitted. You will be notified once the proposal is listed and ready to be voted by the community.`,
        onConfirm: {
          label: "Done",
          onClick: () => {
            dispatch(setSingleActionModal(false));
            router.push("/");
          },
        },
        image,
      }),
    );
  };

  const checkErrors = () => {
    let errors: Array<string> = [];
    let { orgNameError, ethAddressError, projectNameError, orgMissionError, emailError, proofOfOwnershipError } =
      errorMessages;
    if (!inputExists(formData.organizationName)) {
      errors.push(orgNameError);
    }
    if (!isAddress(formData.beneficiaryAddress)) {
      errors.push(ethAddressError);
    }
    if (!inputExists(formData.projectName)) {
      errors.push(projectNameError);
    }
    if (!inputExists(formData.missionStatement)) {
      errors.push(orgMissionError);
    }
    if (!isValidEmail(formData.links.contactEmail)) {
      errors.push(emailError);
    }
    if (activeForm == FormSteps.PROOFS && !inputExists(formData.links.proofOfOwnership)) {
      errors.push(proofOfOwnershipError);
    }
    return errors;
  };

  const nextActiveForm = () => {
    setShowErrors(false);
    let errors = checkErrors();
    if (errors.length > 0) {
      setErrorList(errors);
      setShowErrors(true);
      window.scrollTo(0, 0);
    } else if (activeForm == FormSteps.VISUAL_CONTENT) {
      openModal();
    } else {
      onNextActiveForm();
    }
  };

  return (
    <div className="rounded-lg md:p-10 md:border border-customLightGray">
      <div>
        {activeForm == FormSteps.GENERAL_INFORMATION && (
          <GeneralInformation form={[formData, setFormData]} isEdit={true} />
        )}
        {activeForm == FormSteps.PROOFS && <ProofsForm form={[formData, setFormData]} isEdit={true} />}
        {activeForm == FormSteps.IMPACT_REPORTS && <ImpactReports form={[formData, setFormData]} />}
        {activeForm == FormSteps.VISUAL_CONTENT && <VisualContent form={[formData, setFormData]} />}
      </div>
      <div className="flex gap-8 mt-10">
        {activeForm !== FormSteps.GENERAL_INFORMATION && (
          <Button variant="secondary" className="py-2 px-6 w-full md:w-auto" onClick={onPrevActiveForm}>
            Back
          </Button>
        )}
        <Button variant="primary" className="py-2 px-6 w-full md:w-auto" onClick={nextActiveForm} disabled={uploading}>
          {activeForm == FormSteps.VISUAL_CONTENT ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
};

export default ApplyForm;
