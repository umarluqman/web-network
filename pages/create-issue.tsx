import { GetStaticProps } from 'next'
import React, { useEffect, useState } from 'react';
import BeproService from '../services/bepro';
import GithubMicroService from '../services/github-microservice';
import { setLoadingAttributes } from '../providers/loading-provider';
import InputNumber from '../components/inputNumber';
import { useRouter } from 'next/router';

interface Amount {
  value?: string,
  formattedValue: string,
  floatValue?: number
}

export default function PageCreateIssue() {
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueAmount, setIssueAmount] = useState<Amount>({ value: '0', formattedValue: '0', floatValue: 0});
  const [balance, setBalance] = useState<string>('0');
  const [allowedTransaction, setAllowedTransaction] = useState<boolean>(false);
  const router = useRouter()
  const useBeproBalance = async () => {
    await BeproService.login(); 
    setBalance(await BeproService.network.getBEPROStaked())
  }

  useEffect(() => {
    useBeproBalance()
  },[])

  // TODO add loaders since is slow on metamask
  const allow = async (evt) => {
    evt.preventDefault();        
    await BeproService.login()
      .then(() => setLoadingAttributes(true))
      .catch((error) => handleErrorAndLoading(error));
    const beproAddress = await BeproService.getAddress();
    const payload = {
      amount: issueAmount.floatValue,
      address: beproAddress,
    };
    await BeproService.network
      .approveTransactionalERC20Token()
      .catch((error) => handleErrorAndLoading(error));
    await BeproService.network
      .isApprovedTransactionalToken(payload)
      .then(() => {
        setAllowedTransaction(true);
        setLoadingAttributes(false);
      })
      .catch((error) => handleErrorAndLoading(error));
  };
  
  const createIssue = async (evt) => {
    evt.preventDefault();
    setLoadingAttributes(true);
    const payload = {
      title: issueTitle,
      description: issueDescription,
      issueId: null,
    }
    const beproAddress = await BeproService.getAddress();
    const contractPayload = {tokenAmount: issueAmount.floatValue, cid: beproAddress};
    await BeproService.network.openIssue(contractPayload)
      .then(async (response) => {
        payload.issueId = response.events?.OpenIssue?.returnValues?.id;
        await GithubMicroService.createIssue(payload)
          .then(() => {
            setLoadingAttributes(false);
            cleanFields();
            router.push('/account');
          }).catch((error) => handleErrorAndLoading(error))
      }).catch((error) => handleErrorAndLoading(error))
  }

  const handleErrorAndLoading = (error) => {
    console.error(error)
    setLoadingAttributes(false)
  }

  const cleanFields = () => {
    setIssueTitle('')
    setIssueDescription('')
    setIssueAmount({ value: '0', formattedValue: '0', floatValue: 0})
    setAllowedTransaction(false)
  }

  const issueContentIsValid = (): boolean =>  !!issueTitle && !!issueDescription;

  const verifyAmountBiggerThanBalance = (): boolean => !(issueAmount.floatValue > Number(balance))

  const isButtonDisabled = (): boolean => {
    return [
      allowedTransaction,
      issueContentIsValid(),
      verifyAmountBiggerThanBalance(),
      issueAmount.floatValue > 0, 
      !!issueAmount.formattedValue
    ].some(value => value === false);
  }

  const handleIssueAmountBlurChange = () => {
    if (issueAmount.floatValue > Number(balance)) {
      setIssueAmount({formattedValue: balance});
    }
  }

  const handleIssueAmountOnValueChange = (values: Amount) => {
    if (values.floatValue < 0 || values.value === '-'){
      setIssueAmount({formattedValue: ''})
    }else {
      setIssueAmount(values)
    }
  }

  return (
      <>
        <div className="banner bg-bepro-blue mb-4">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-10">
                <div className="d-flex justify-content-center">
                  <h1 className="h1 mb-0">Create new issue</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
        <form onSubmit={createIssue}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-10">
                <div className="content-wrapper mt-up mb-5">
                  <h3 className="h3 mr-2 mb-4">Details</h3>
                  <div className="form-group mb-4">
                    <label className="p-small mb-2">Issue title</label>
                    <input type="text"
                      className="form-control" placeholder="Your issue title"
                      value={issueTitle}
                      onChange={e => setIssueTitle(e.target.value)}
                      />
                    <p className="p-small trans my-2">Tip: Try to be as much descriptive as possible</p>
                  </div>
                  <div className="form-group col-md-4 mb-4">
                    <InputNumber min="0" max={balance} className="form-control"
                      label="Set $BEPRO value"
                      value={issueAmount.formattedValue}
                      onValueChange={handleIssueAmountOnValueChange}
                      onBlur={handleIssueAmountBlurChange}/>
                    <div className="d-flex justify-content">
                      <p className="p-small trans my-2">{balance} $BEPRO </p> 
                      <a className="button-max p-small ms-1 my-2" onClick={() => setIssueAmount({formattedValue: balance})}>(Max)</a> 
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="p-small mb-2">Description</label>
                    <textarea className="form-control" rows={6} placeholder="Type a description..."
                    value={issueDescription}
                    onChange={e => setIssueDescription(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="d-flex justify-content-center align-items-center mt-4">
                  {!allowedTransaction ?
                        <button className="btn btn-lg btn-opac me-3 px-5" onClick={allow}>Approve</button>
                      : null
                  }
                    <button className="btn btn-lg btn-primary px-4" disabled={isButtonDisabled()}>Create Issue</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </form>
      </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {}
  }
}
