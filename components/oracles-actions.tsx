import {Fragment, useContext, useEffect, useRef, useState} from 'react';
import { NumberFormatValues } from "react-number-format";
import InputNumber from "./input-number";
import OraclesBoxHeader from "./oracles-box-header";
import Modal from "./modal";
import {ApplicationContext} from '../contexts/application';
import {BeproService} from '../services/bepro-service';
import {changeLoadState} from '../contexts/reducers/change-load-state';
import ApproveButton from './approve-button';
import TransferOraclesButton from './transfer-oracles-button';
import NetworkTxButton from './network-tx-button';

const actions: string[] = ["Lock", "Unlock"];

function OraclesActions(): JSX.Element {
  const {state: {beproInit, metaMaskWallet}, dispatch} = useContext(ApplicationContext);

  const [show, setShow] = useState<boolean>(false);
  const [action, setAction] = useState<string>(actions[0]);
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState(``);

  const networkTxRef = useRef<HTMLButtonElement>(null);
  const renderAmount = tokenAmount ? `${tokenAmount} ` : "";

  const renderInfo = {
    Lock: {
      title: "Lock $BEPRO",
      description: "Lock $BEPRO to get oracles",
      label: `Get ${renderAmount}oracles`,
      caption: "Get Oracles from $BEPRO",
      body: `You are locking ${tokenAmount} $BEPRO /br/ to get /oracles${tokenAmount} Oracles/`,
      params() {
        return { tokenAmount };
      },
    },
    Unlock: {
      title: "Unlock $BEPRO",
      description: "Unlock $BEPRO by giving away oracles",
      label: `Recover ${renderAmount}$BEPRO`,
      caption: "Get $BEPRO from Oracles",
      body: `Give away /oracles${tokenAmount} Oracles/ /br/ to get back ${tokenAmount} $BEPRO`,
      params(from: string) {
        return { tokenAmount, from };
      },
    },
  }[action];

  function updateWalletAddress() {
    if (!beproInit || !metaMaskWallet)
      return;

    setWalletAddress(BeproService.address);
  }

  function handleChangeToken(params: NumberFormatValues) {
    setTokenAmount(params.floatValue);
  }

  function handleCheck(isChecked: boolean) {
    if (!tokenAmount) {
      return setError("$BEPRO amount needs to be higher than 0.");
    }

    setShow(isChecked);
    setIsApproved(isChecked);
    setError(
      !isChecked ? "Settler token not approved. Check it and try again." : "",
    );
  }

  function handleConfirm() {
    networkTxRef.current.click();
  }

  function handleCancel() {
    setTokenAmount(0);
    setIsApproved(false);
    setShow(false);
  }

  function approveSettlerToken() {
    if (!beproInit || !metaMaskWallet)
      return;

    dispatch(changeLoadState(true));

    BeproService.network.approveSettlerERC20Token()
                .then(({status}) => {
                  console.log(`status`, status);
                  return status
                })
                .then(setIsApproved)
                .finally(() => {
                  dispatch(changeLoadState(false));
                });
  }

  function checkLockedAmount() {
    if (!beproInit || !metaMaskWallet)
      return;

    BeproService.network
                .isApprovedSettlerToken({address: BeproService.address, amount: tokenAmount})
                .then(handleCheck);
  }

  useEffect(() => {
    setIsApproved(false);
    setError("");
  }, [tokenAmount, action]);

  useEffect(updateWalletAddress, [beproInit, metaMaskWallet])

  return (
    <>
      <div className="col-md-5">
        <div className="content-wrapper">
          <OraclesBoxHeader actions={actions} onChange={setAction} currentAction={action} />

          <p className="p text-white">{renderInfo.description}</p>

          <InputNumber
            disabled={isApproved || !metaMaskWallet}
            label="$BEPRO Amount"
            symbol="$BEPRO"
            error={error}
            helperText={error}
            value={tokenAmount}
            onValueChange={handleChangeToken}
            thousandSeparator />

          <ApproveButton disabled={isApproved || !tokenAmount || !metaMaskWallet} onClick={approveSettlerToken} />
          <TransferOraclesButton buttonLabel={renderInfo.label} disabled={!isApproved || !metaMaskWallet} onClick={checkLockedAmount} />

          <NetworkTxButton txMethod={action.toLowerCase()}
                           txParams={renderInfo.params(walletAddress)}
                           buttonLabel=""
                           modalTitle={renderInfo.tile}
                           modalDescription={renderInfo.description}
                           onSuccess={handleCancel}
                           onFail={setError}
                           ref={networkTxRef} />

        </div>
      </div>



      <Modal
        title={renderInfo.title}
        show={show}
        footer={
          <>
            <button className="btn btn-md btn-opac" onClick={handleCancel}>
              Cancel
            </button>
            <button className="btn btn-md btn-primary" onClick={handleConfirm}>
              Confirm
            </button>
          </>
        }>
        <p className="p-small text-white-50 text-center">
          {renderInfo.caption}
        </p>
        <p className="text-center fs-4">
          {renderInfo.body?.split("/").map((sentence: string) => {
            const Component =
              (sentence.startsWith("oracles") && "span") || Fragment;

            return (
              <Fragment key={sentence}>
                <Component
                  {...(sentence.startsWith("oracles") && {
                    className: "text-bold color-purple",
                  })}>
                  {sentence.replace(/oracles|br/, "")}
                </Component>
                {sentence.startsWith("br") && <br />}
              </Fragment>
            );
          })}
        </p>
      </Modal>
    </>
  );
}

export default OraclesActions;