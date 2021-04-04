import Modal from '../containers/modal';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useState, useEffect } from 'react';
import { Contract } from '@ethersproject/contracts';
import { connectors } from '../containers/Web3/connectors';
import LockPopSlider from '../containers/lockPopSlider';
import Staking from '../../contracts/artifacts/contracts/Staking.sol/Staking.json';
import MockPop from '../../contracts/artifacts/contracts/mocks/MockERC20.sol/MockERC20.json';
import { utils } from 'ethers';

export default function LockPop() {

  const context = useWeb3React<Web3Provider>();
    const {
      library,
      account,
      activate,
      active,
    } = context;
    const [staking, setStaking] = useState<Contract>();
    const [mockERC, setMockERC] = useState<Contract>(); 
    const [votes, setVotes] = useState<number>(0);
    const [duration, setDuration] = useState<string>('1 week');
    const [popBalance, setPopBalance] = useState<number>(0);
    const [confirmModal, setConfirmModal] = useState<string>('invisible');
    const [connectModal, setConnectModal] = useState<string>('invisible');
    const [completeModal, setCompleteModal] = useState<string>('invisible');
    const [errorModal, setErrorModal] = useState<string>('invisible');
    const [errorMsg, setErrorMsg] = useState<string>('');

    const stakingAddress = process.env.ADDR_STAKING;
    const mockERCAddress = process.env.ADDR_POP;
    console.log("addresses", stakingAddress, mockERCAddress)
    
    const ONE_WEEK = 604800;
    const lockPeriods = { 
      '1 week': ONE_WEEK, 
      '1 month': ONE_WEEK * 4, 
      '3 months': ONE_WEEK * 4 * 3, 
      '6 months': ONE_WEEK * 4 * 6, 
      '1 year': ONE_WEEK * 52, 
      '4 years': ONE_WEEK * 52 * 4 
    };

    async function lockPop(amountToLock) {
      amountToLock = utils.parseEther(amountToLock.toString());
      const signer = library.getSigner();

      const connected = await mockERC.connect(signer)
      console.log(connected);

      await connected.approve(stakingAddress, amountToLock).then(res => console.log('approved', res))
      .catch(err => console.log('err', err));

      const connectedStaking = await staking.connect(signer);
      await connectedStaking.stake(amountToLock, lockPeriods[duration])
      .then(rez => {
        console.log('successfully staked',rez);
        setConfirmModal('invisible');
        setCompleteModal('visible');
      })
      .catch(err => {
        console.log(err, 'err');
        setErrorModal('visible');
        setErrorMsg(err.data?.message);
      });

      
    }

    function connectWallet() {
      activate(connectors.Injected);
      setConnectModal('invisible')
    }

    useEffect(() => {
      if (!account) {
        setConnectModal('visible')
      }
    }, [])

  useEffect(() => {
    if (!active) {
      activate(connectors.Network);
      if (library?.connection?.url === 'metamask') {
        //TODO get pop -> to tell the user to either lock them or buy some
        //TODO get locked pop -> to vote or tell the user to lock pop
        //TODO swap the contract provider to signer so the user can vote
        //grantRegistry.connect(library.getSigner());
      }
    }
  }, [active]);

  async function getBalance() {
    const PopBalance = await mockERC.balanceOf(account);
    setPopBalance(+utils.formatEther(PopBalance.toString()));
  }

  useEffect(() => {
    if (account && mockERC && confirmModal === 'invisible') {
      getBalance();
    }
  }, [account, mockERC, confirmModal, completeModal])

    useEffect(() => {
      if (!library) {
        return
      }
      setStaking(
        new Contract(
          stakingAddress,
          Staking.abi,
          library,
        ),
      );

      setMockERC(
        new Contract(
          mockERCAddress,
          MockPop.abi,
          library,
        ),
      );
  
    }, [library, active])

    function assignVotes(id, votes) {
      console.log(id, votes, 'idv')
      setVotes(votes);
    }

    function CompleteModal() {
      return (
        <Modal visible={completeModal}>
            <p>You have successfully locked {votes} POP for {duration}</p>
            <div className="button-modal-holder">
              <button onClick={() => setCompleteModal('invisible')} className="button-1">Lock more POP</button>
              <button className='button-1' onClick={() => setCompleteModal('invisible')}>Vote in Grant</button>
            </div>
          </Modal>
      )
    }

    function ErrorModal() {
      return (
        <Modal visible={errorModal}>
            <p>There was an error</p>
            <p>{errorMsg}</p>
            <div className="button-modal-holder">
              <button onClick={() => setErrorMsg('invisible')} className="button-1">Try again</button>
            </div>
          </Modal>
      )
    }

  return (
        <div className="w-screen">
          <Modal visible={confirmModal}>
            <p>Are you sure you want to lock {votes} POP for {duration} ?</p>
            <div className="button-modal-holder">
              <button onClick={() => lockPop(votes)} className="button-1">Confirm</button>
              <button className='button-1' onClick={() => setConfirmModal('invisible')}>Cancel</button>
            </div>
          </Modal>
          {CompleteModal()}
          {ErrorModal()}
          <Modal visible={connectModal}>
            <p>You must connect your wallet to be able to lock any POP</p>
            <button onClick={connectWallet} className='button-1'>Connect Wallet</button>
          </Modal>

            <header className="w-full h-10 bg-white"></header>
            <div className="lockpop-page-container">
              <div className="w-2/12 flex flex-col items-center">

            </div>
          <div className="lockpop-content-div">
            <div className="lockpop-form-div">
              <h1 className="lock-pop-title">Lock your POP</h1>
              <p className="lockpop-explanation">In order to participate in the selection of beneficiaries and awarding grants to beneficiaries, you must first lock your tokens.
              </p>

              <div className="pop-available-div">
                <p>You have {popBalance} POP tokens available to lock</p>
              </div>

              <div className="slider-div">
                <LockPopSlider id="lock-pop-slider" assignVotes={assignVotes} maxVotes={popBalance} totalVotes={votes} votesAssignedByUser={votes} />    
              </div>
              {/* <p>Click below to stake {votes} Pop</p> */}

              <p className="lockpop-time">how long do you want to lock your POP for? </p>
          
              <p className="lockpop-small">Locking tokens for a longer period of time will give you more voting power.</p>
              
              <select className="select-time" value={duration} onChange={(v) => setDuration(v.target.value)}>
                {Object.keys(lockPeriods).map(duration => <option key={duration} value={duration}>{duration}</option>)}
              </select>
              {/* <p>Voting power = POP locked * duration / maximum duration</p> */}
              <div className='voting-power-div'>
                <p>Voice Credits (voting power): </p>
                <p className="bold "> {votes * (lockPeriods[duration] / lockPeriods['4 years']) }</p>
              </div>
              <button disabled={!votes || !duration} className="button-1 lock-pop-button" onClick={() => setConfirmModal('visible')}>Lock POP</button>          
            </div>
            </div>
            </div>
         </div>
  )
}