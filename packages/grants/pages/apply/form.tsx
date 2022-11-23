import { Web3Provider } from "@ethersproject/providers";
import { XCircleIcon } from "@heroicons/react/solid";
import { BeneficiaryApplication } from "helper/types";
import { formatAndRoundBigNumber, getBytes32FromIpfsHash, IpfsClient } from "@popcorn/utils";
import { useWeb3React } from "@web3-react/core";
import FlowSteps from "components/Apply/FlowSteps";
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
import { setSingleActionModal } from "../../context/actions";
import { store } from "../../context/store";

export const defaultFormData: BeneficiaryApplication = {
  organizationName: "",
  projectName: "",
  missionStatement: "",
  beneficiaryAddress: "",
  proposalCategory: "",
  files: {
    profileImage: { image: "", description: "" },
    headerImage: { image: "", description: "" },
    impactReports: [],
    additionalImages: [],
    video: "",
  },
  links: {
    twitterUrl: "",
    linkedinUrl: "",
    telegramUrl: "",
    signalUrl: "",
    proofOfOwnership: "",
    contactEmail: "",
    website: "",
  },
  version: "1.0",
};

export enum FormSteps {
  GENERAL_INFORMATION,
  PROOFS,
  IMPACT_REPORTS,
  VISUAL_CONTENT,
}

const ApplyForm = () => {
  const { library, account, activate, active } = useWeb3React<Web3Provider>();

  const [activeForm, setActiveForm] = useState<FormSteps>(FormSteps.GENERAL_INFORMATION);
  const [formData, setFormData] = useState<BeneficiaryApplication>(defaultFormData);
  const [errorList, setErrorList] = useState<Array<string>>([]);
  const [showErrors, setShowErrors] = useState<boolean>(false);
  const { dispatch } = useContext(store);
  const { contracts } = useContext(ContractsContext);
  const [proposalBond, setProposalBond] = useState<BigNumber>();
  const router = useRouter();
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    const formData = localStorage.getItem("beneficiaryApplicationForm");
    if (formData !== null) setFormData(JSON.parse(formData));
    const currentStep: FormSteps = parseInt(localStorage.getItem("beneficiaryApplicationStep"));
    if (currentStep) setActiveForm(currentStep);
  }, []);

  useEffect(() => {
    localStorage.setItem("beneficiaryApplicationForm", JSON.stringify(formData));
  }, [formData]);

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
      let step = activeForm + 1;
      setActiveForm(step);
      localStorage.setItem("beneficiaryApplicationStep", JSON.stringify(step));
    }
  };

  const prevActiveForm = () => {
    let step = activeForm - 1;
    setActiveForm(step);
    localStorage.setItem("beneficiaryApplicationStep", JSON.stringify(step));
  };

  const success = () => toast.success("Successful upload to IPFS");
  const loading = () => toast.loading("Uploading to IPFS...");

  const checkPreConditions = async (): Promise<boolean> => {
    console.log("calling this function");
    if (!contracts) {
      return false;
    }
    if (!account) {
      activate(connectors.Injected);
    }
    const balance = await contracts?.pop?.balanceOf(account);
    if (proposalBond?.gt(balance)) {
      dispatch(setSingleActionModal(false));
      dispatch(
        setSingleActionModal({
          image: <img src="/images/accept.svg" alt="not enough pop" />,
          content: `In order to create a proposal you need to post a Bond of ${formatAndRoundBigNumber(
            proposalBond,
            18,
          )} POP`,
          title: "You need more POP",
          visible: true,
          onConfirm: {
            label: "Close",
            onClick: () => {
              dispatch(setSingleActionModal(false));
            },
          },
          onDismiss: {
            onClick: () => dispatch(setSingleActionModal({ visible: false })),
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
      dispatch(setSingleActionModal(false));
      try {
        const cid = await IpfsClient.add(submissionData);
        toast.dismiss();
        await (
          await contracts?.pop
            ?.connect(library.getSigner())
            ?.approve(contracts.beneficiaryGovernance.address, proposalBond)
        )?.wait();

        await contracts.beneficiaryGovernance
          .connect(library.getSigner())
          .createProposal(submissionData.beneficiaryAddress, ethers.utils.id("World"), getBytes32FromIpfsHash(cid), 0);
      } catch (error) {
        dispatch(
          setSingleActionModal({
            image: <img src="/images/accept.svg" alt="error" />,
            title: "Error",
            content: error?.data?.message || error?.message || error,
            onConfirm: {
              label: "Close",
              onClick: () => {
                setUploading(false);
                dispatch(setSingleActionModal(false));
              },
            },
            onDismiss: {
              onClick: () => dispatch(setSingleActionModal({ visible: false })),
            },
          }),
        );
        setUploading(false);
        return;
      }
      success();
      dispatch(setSingleActionModal(false));
      congratsModal();
    }
    setUploading(false);
  };

  const clearLocalStorage = () => {
    setActiveForm(FormSteps.GENERAL_INFORMATION);
    localStorage.removeItem("beneficiaryApplicationStep");
    setFormData(defaultFormData);
    localStorage.setItem("beneficiaryApplicationForm", JSON.stringify(defaultFormData));
  };

  const getProposalBond = async (): Promise<BigNumber> => {
    const proposalDefaultConfigurations = await contracts?.beneficiaryGovernance?.DefaultConfigurations();
    return proposalDefaultConfigurations?.proposalBond;
  };

  const openModal = () => {
    dispatch(
      setSingleActionModal({
        image: <img src="/images/accept-application.svg" alt="Submit Modal Icon" />,
        title: "Submit Application",
        children: (
          <div className="text-base md:text-sm text-primaryDark mt-4">
            <p className="leading-[140%]">
              By confirming the proposal submission, you commit to locking 2000 POP for the duration of the proposal
              process
            </p>
            <p className="leading-[140%] mt-4">
              If the nomination does not pass, the token that were locked at the time of submission will be kept in the
              contract. After a successful nomination, the tokens will be claimable by nominating user.
            </p>
          </div>
        ),
        onConfirm: {
          label: "Lock & Submit",
          onClick: () => uploadJsonToIpfs(formData),
        },
        onDismiss: {
          label: "Cancel",
          onClick: () => {
            setUploading(false);
            dispatch(setSingleActionModal(false));
          },
        },
      }),
    );
  };

  const congratsModal = () => {
    dispatch(
      setSingleActionModal({
        image: <img src="/images/accept.svg" alt="Congratulations" />,
        title: "Congratulations",
        content: `The application for becoming an eligible beneficiary has been submitted. You will be notified once the proposal is listed and ready to be voted by the community.`,
        onConfirm: {
          label: "Continue",
          onClick: () => {
            clearLocalStorage();
            dispatch(setSingleActionModal(false));
            router.push("/");
          },
        },
        onDismiss: {
          onClick: () => {
            dispatch(setSingleActionModal(false));
          },
        },
      }),
    );
  };

  return (
    <main className="container mx-auto pt-20">
      <div className="lg:px-36">
        {showErrors ? (
          <div className="bg-red-50 rounded-3xl p-5">
            <div className="flex items-center gap-2">
              <XCircleIcon className=" text-red-400 w-4 h-4" />{" "}
              <p className=" font-semibold text-red-800">There were {errorList.length} errors with your submission</p>
            </div>
            <ul className=" list-disc pl-4">
              {errorList.map((error, index) => (
                <li className="text-red-700" key={index}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <FlowSteps active={activeForm} />
        )}
        <div className="rounded-lg px-6 py-10 md:p-10 mt-10 md:mt-20 mx-6 md:mx-0 border border-customLightGray">
          {activeForm == FormSteps.GENERAL_INFORMATION && <GeneralInformation form={[formData, setFormData]} />}
          {activeForm == FormSteps.PROOFS && <ProofsForm form={[formData, setFormData]} />}
          {activeForm == FormSteps.IMPACT_REPORTS && <ImpactReports form={[formData, setFormData]} />}
          {activeForm == FormSteps.VISUAL_CONTENT && <VisualContent form={[formData, setFormData]} />}
        </div>
        <div className="flex justify-center gap-8 mt-10 md:mt-20 px-6">
          {activeForm !== FormSteps.GENERAL_INFORMATION && (
            <Button variant="secondary" className="py-2 px-6 w-full md:w-auto" onClick={prevActiveForm}>
              Back
            </Button>
          )}
          <Button
            variant="primary"
            className="py-2 px-6 w-full md:w-auto"
            onClick={nextActiveForm}
            disabled={uploading}
          >
            {activeForm == FormSteps.VISUAL_CONTENT ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default ApplyForm;
