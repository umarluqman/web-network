import * as CommentsQueries from "graphql/comments";
import * as PullRequestQueries from "graphql/pull-request";
import * as RepositoryQueries from "graphql/repository";
import * as UserQueries from "graphql/user";

import { getPropertyRecursively } from "helpers/object";

import { api } from "services/api";

import { GraphQlQueryResponseData, GraphQlResponse } from "types/octokit";

export default function useOctokit() {
  function getOwnerRepoFrom(path: string) {
    const [owner, repo] = path.split("/");
    
    return { owner, repo };
  }

  function makeOctokitRequest(query: string, params, useBotToken?: boolean): Promise<GraphQlResponse> {
    return api.post("/graphql", { query, params, useBotToken }).then(({ data }) => data).catch(error => {
      console.log("makeOctokitRequest", error);

      return error.data;
    });
  }

  /**
   * Get all pages of a graphql list, the query MUST CONTAIN `pageInfo` and `cursor` parameters
   * @param query string containing the GraphQL query
   * @param variables that mus be passed to the GraphQL query
   * @returns an array of objects containing the data returned by the GraphQL query
   */
  async function getAllPages(query, variables, useBotToken?: boolean): Promise<GraphQlResponse[]> {
    const pages = [];
    let nextPageCursor = null;
    let hasMorePages = false;

    do {
      const response = await makeOctokitRequest(query, { ...variables, cursor: nextPageCursor }, useBotToken);

      pages.push(response);

      if(response){
        const pageInfo = getPropertyRecursively<GraphQlQueryResponseData>("pageInfo", response);

        if (pageInfo) {
          const { endCursor, hasNextPage } = pageInfo;

          nextPageCursor = endCursor;
          hasMorePages = hasNextPage;
        }
      }

    } while (hasMorePages);

    return pages;
  }

  async function getPullRequestParticipants(repositoryPath:  string, pullId: number): Promise<string[]> {
    const { owner, repo } = getOwnerRepoFrom(repositoryPath);

    const response = await getAllPages(PullRequestQueries.Participants, {
      repo,
      owner,
      pullId
    });

    const participants = 
      response?.flatMap(item => getPropertyRecursively<GraphQlQueryResponseData>("nodes", item)
                                .map(node => node["login"]));

    return participants;
  }

  async function getPullRequestLinesOfCode(repositoryPath:  string, pullId: number): Promise<number> {
    const { owner, repo } = getOwnerRepoFrom(repositoryPath);

    const response = await makeOctokitRequest(PullRequestQueries.LinesOfCode, {
      repo,
      owner,
      pullId
    });

    const { additions, deletions } = response.repository.pullRequest;

    return additions + deletions;
  }

  async function getIssueOrPullRequestComments(repositoryPath:  string, id: number) {
    const { owner, repo } = getOwnerRepoFrom(repositoryPath);

    const response = await getAllPages(CommentsQueries.List, {
      repo,
      owner,
      id
    });

    const comments = 
      response?.flatMap(item => getPropertyRecursively<GraphQlQueryResponseData>("nodes", item)
                        ?.map(node => ({...node, author: node["author"]["login"]}) ) );

    return comments.filter(el => el) || [];
  }

  async function getPullRequestList(repositoryPath:  string) {
    const { owner, repo } = getOwnerRepoFrom(repositoryPath);

    const response = await getAllPages(PullRequestQueries.PullRequests, {
      repo,
      owner,
    });

    const pullRequests = response?.flatMap((item: any)=> item?.repository?.pullRequests?.nodes || [])
    
    return pullRequests || [];
  }

  async function getPullRequestDetails(repositoryPath:  string, id: number) {
    const { owner, repo } = getOwnerRepoFrom(repositoryPath);

    const response = await makeOctokitRequest(PullRequestQueries.Details, {
      repo,
      owner,
      id
    });
    if(!response?.repository) return

    const { mergeable, merged, state } = response.repository.pullRequest;

    return { mergeable, merged, state };
  }

  //  Note: if repository not exist or it private will return null
  async function getRepository(repositoryPath:  string) {
    const { owner, repo } = getOwnerRepoFrom(repositoryPath);

    const response = await getAllPages(RepositoryQueries.Repository, {
      repo,
      owner
    });

    const repository = response?.flatMap((item)=> getPropertyRecursively<GraphQlQueryResponseData>("repository", item))

    return repository?.[0] || null;
  }

  async function getRepositoryForks(repositoryPath:  string) {
    const { owner, repo } = getOwnerRepoFrom(repositoryPath);

    const response = await getAllPages(RepositoryQueries.Forks, {
      repo,
      owner
    });

    const forks = 
      response?.flatMap(item => getPropertyRecursively<GraphQlQueryResponseData>("nodes", item)
                                ?.map(node => node?.owner?.login ) );

    return forks || [];
  }

  async function getRepositoryBranches(repositoryPath: string, useBotToken?: boolean) {
    const { owner, repo } = getOwnerRepoFrom(repositoryPath);

    const response = await getAllPages(RepositoryQueries.Branches, {
      repo,
      owner
    }, useBotToken) as any;

    const branches = response?.flatMap(item => item?.repository?.refs?.nodes?.map(node => node?.name ) );

    return {
      ...response[0]?.repository,
      owner: response[0]?.repository?.owner?.login,
      branches: branches || []
    };
  }

  async function getUserRepositories(login:  string, botUser?: string) {

    const response = await getAllPages(UserQueries.Repositories(botUser), {
      login
    });

    const userRepositories = response.flatMap<{
      name: string;
      nameWithOwner: string;
      isFork: boolean;
      isArchived: boolean;
      isInOrganization: boolean;
      owner: string;
      viewerPermission: "ADMIN" | "MAINTAIN" | "READ" | "TRIAGE" | "WRITE";
      mergeCommitAllowed: boolean;
      parent?: {
        name: string;
        nameWithOwner: string;
      },
      collaborators: string[];
    }>(item => {
      return getPropertyRecursively<GraphQlQueryResponseData>("nodes", item?.["user"]?.repositories)
        ?.map(el => ({
          ...el,
          owner: el.owner.login,
          collaborators: el.collaborators?.nodes?.flatMap(c => c.login) || []
        }));
    });

    return userRepositories || [];
  }

  async function getUserRepository(login: string, repositoryName: string) {
    const response = await makeOctokitRequest(UserQueries.Repository, {
      login,
      repo: repositoryName
    });

    return getPropertyRecursively<GraphQlQueryResponseData>("repository", response);
  }
  
  return {
    getPullRequestParticipants,
    getPullRequestLinesOfCode,
    getIssueOrPullRequestComments,
    getPullRequestDetails,
    getPullRequestList,
    getRepository,
    getRepositoryForks,
    getRepositoryBranches,
    getUserRepositories,
    getUserRepository
  };
}
