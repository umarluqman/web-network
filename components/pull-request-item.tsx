import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { getTimeDifferenceInWords } from '@helpers/formatDate'

import LockedIcon from '@assets/icons/locked-icon'

import Button from '@components/button'
import Avatar from '@components/avatar'
import Translation from '@components/translation'
import ReadOnlyButtonWrapper from '@components/read-only-button-wrapper'
import PullRequestLabels, { PRLabel } from '@components/pull-request-labels'

import { useAuthentication } from '@contexts/authentication'

import { formatNumberToNScale } from '@helpers/formatNumber'

import useOctokit from '@x-hooks/use-octokit'
import useNetwork from '@x-hooks/use-network'

export default function PullRequestItem({
  repoId,
  issueId,
  pullRequest,
  repositoryPath
}) {

  const router = useRouter()
  const { getCommitsOfPr, getCommit } = useOctokit()
  const [linesOfCode, setLinesOfCode] = useState(0)

  const { getURLWithNetwork } = useNetwork()

  const { user } = useAuthentication()

  function handleReviewClick() {
    router.push(
      getURLWithNetwork('/pull-request', {
        repoId,
        issueId,
        prId: pullRequest.githubId,
        review: true
      })
    )
  }

  function canReview() {
    return pullRequest?.state === 'open' && !!user?.login
  }

  function getLabel(): PRLabel{
    if(pullRequest.merged) return 'merged';
    if(pullRequest.isMergeable) return 'ready to merge';
    //isMergeable can be null;
    if(pullRequest.isMergeable === false) return 'conflicts';
  }

  const label = getLabel()

  async function getPullRequestInfo() {
    try {
      const [owner, repo] = repositoryPath.split('/')
      let lines = 0
      
      const { data } = await getCommitsOfPr(pullRequest?.githubId, repositoryPath)
      
      for(const commit of data) {
        const {data: { stats }} = await getCommit(owner, repo, commit.sha)
        lines += stats.total
      }

      setLinesOfCode(lines)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (!pullRequest || !repositoryPath) return
    
    getPullRequestInfo()
  }, [repositoryPath])
  
  return (
    <>
      <div className="content-list-item proposal">
        <Link
          passHref
          href={getURLWithNetwork('/pull-request', {
            repoId,
            issueId,
            prId: pullRequest.githubId
          })}
        >
          <a className="text-decoration-none text-white">
            <div className="row align-items-center pl-1 pr-1">
              <div className="col-6 d-flex align-items-center caption-small text-uppercase text-white">
                <Avatar userLogin={pullRequest?.githubLogin} />
                <span className="ml-2">
                  #{pullRequest?.githubId} <Translation label={'misc.by'} /> @
                  {pullRequest?.githubLogin}
                </span>
                <div className='ml-3 d-flex'>
                  {label && <PullRequestLabels label={label}/>}
                </div>
              </div>

              <div className="col-1 caption-small text-uppercase text-white d-flex justify-content-center">
                {formatNumberToNScale(linesOfCode)} <span className="text-gray ml-1">LOC</span>
              </div>

              <div className="col-2 caption-small text-uppercase text-white d-flex justify-content-center">
                <span>
                  {pullRequest?.comments?.length || 0}
                </span>

                <span className="text-gray ml-1">
                  <Translation
                    ns="pull-request"
                    label="review"
                    params={{ count: pullRequest?.comments?.length || 0 }}
                  />
                </span>
              </div>

              <div className="col-2 caption-small text-uppercase text-gray d-flex justify-content-start">
                {getTimeDifferenceInWords(new Date(pullRequest?.createdAt), new Date())} ago
              </div>

              <div className="col-1 d-flex justify-content-center">
                <ReadOnlyButtonWrapper>
                  <Button
                    className="mr-3 read-only-button"
                    disabled={!canReview()}
                    onClick={(ev) => {
                      ev.preventDefault()
                      handleReviewClick()
                    }}
                  >
                    {!canReview() && <LockedIcon className="me-2" />}
                    <span>
                      <Translation label="actions.review" />
                    </span>
                  </Button>
                </ReadOnlyButtonWrapper>
              </div>
            </div>
          </a>
        </Link>
      </div>
    </>
  )
}
