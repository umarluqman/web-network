import React, {useEffect, useState} from "react";

import {serverSideTranslations} from "next-i18next/serverSideTranslations";
import {useRouter} from "next/router";
import {GetServerSideProps} from "next/types";

import BountyHero from "components/bounty-hero";
import FundingSection from "components/bounty/funding-section";
import TabSections from "components/bounty/tabs-sections";
import CustomContainer from "components/custom-container";
import IssueComments from "components/issue-comments";
import IssueDescription from "components/issue-description";
import IssueProposalProgressBar from "components/issue-proposal-progress-bar";
import PageActions from "components/page-actions";

import {useAppState} from "contexts/app-state";
import {BountyEffectsProvider} from "contexts/bounty-effects";

import {useBounty} from "x-hooks/use-bounty";
import useOctokit from "x-hooks/use-octokit";
import {useRepos} from "x-hooks/use-repos";


export default function PageIssue() {
  useBounty();
  const router = useRouter();

  const [commentsIssue, setCommentsIssue] = useState([]);
  const [isRepoForked, setIsRepoForked] = useState<boolean>();

  const {state} = useAppState();

  const {updateActiveRepo} = useRepos()
  const { getUserRepository } = useOctokit();

  const { id, repoId } = router.query;
  updateActiveRepo(repoId);

  function checkForks(){
    if (!state.Service?.network?.repos?.active?.githubPath || isRepoForked !== undefined) return;

    if (state.currentBounty?.data?.working?.includes(state.currentUser?.login))
      return setIsRepoForked(true);

    const [, activeName] = state.Service.network.repos.active.githubPath.split("/");
  
    getUserRepository(state.currentUser?.login, activeName)
    .then(repository => {
      const { isFork, parent: { nameWithOwner } } = repository;

      setIsRepoForked(isFork && nameWithOwner === state.Service.network.repos.active.githubPath);
    })
    .catch((e) => {
      setIsRepoForked(false);
      console.log("Failed to get users repositories: ", e);
    });
  }

  function addNewComment(comment) {
    setCommentsIssue([...commentsIssue, comment]);
  }

  useEffect(() => {
    if (state.currentBounty?.comments) setCommentsIssue([...state.currentBounty?.comments || []]);
  }, [ state.currentBounty?.data, state.Service?.network?.repos?.active ]);

  useEffect(() => {
    if (!state.currentUser?.login ||
        !state.Service?.network?.repos?.active ||
        !state.currentBounty?.data) 
      return;
    checkForks();
  },[state.currentUser?.login, 
     state.currentBounty?.data?.working, 
     state.Service?.network?.repos?.active
  ]);

  return (
    <BountyEffectsProvider>
      <BountyHero />

      { state.currentBounty?.chainData?.isFundingRequest ? <FundingSection /> : null}

      <PageActions
        isRepoForked={!!isRepoForked}
        addNewComment={addNewComment}
      />

      {(state.currentUser?.walletAddress)
        ? <TabSections/>
        : null
      }

      { state.currentUser?.walletAddress ? (
        <div className="container mb-1">
          <div className="d-flex bd-highlight justify-content-center mx-2 px-4">
            <div className="ps-3 pe-0 ms-0 me-2 w-65 bd-highlight">
              <div className="container">
                <IssueDescription description={state.currentBounty?.data?.body || ""} />
              </div>
            </div>
            <div className="p-0 me-3 flex-shrink-0 w-25 bd-highlight">
              <div className="sticky-bounty">
                <IssueProposalProgressBar />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <CustomContainer>
          <IssueDescription description={state.currentBounty?.data?.body || ""} />
        </CustomContainer>
      )}

      <IssueComments
        comments={commentsIssue}
        repo={state.currentBounty?.data?.repository?.githubPath}
        issueId={id}
      />
    </BountyEffectsProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async ({locale}) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        "common",
        "bounty",
        "proposal",
        "pull-request",
        "connect-wallet-button",
        "funding"
      ]))
    }
  };
};
