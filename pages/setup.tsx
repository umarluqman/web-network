import { useEffect, useState } from "react";
import { Container, Row } from "react-bootstrap";

import { GetServerSideProps } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import getConfig from "next/config";
import { useRouter } from "next/router";

import ConnectWalletButton from "components/connect-wallet-button";
import { NetworkSetup } from "components/setup/network-setup";
import { RegistrySetup } from "components/setup/registry-setup";
import TabbedNavigation from "components/tabbed-navigation";

import { useAppState } from "contexts/app-state";

import { Network } from "interfaces/network";

import useApi from "x-hooks/use-api";

const { publicRuntimeConfig: { adminWallet } } = getConfig();

export default function SetupPage(){
  const { replace } = useRouter();
  const { t } = useTranslation("setup")

  const [activeTab, setActiveTab] = useState("registry");
  const [defaultNetwork, setDefaultNetwork] = useState<Network>();

  const { searchNetworks } = useApi();
  const { state: { currentUser, Settings } } = useAppState();

  const isConnected = !!currentUser?.walletAddress;
  const isAdmin = adminWallet === currentUser?.walletAddress;

  const networkRegistryAddress = Settings?.contracts?.networkRegistry;

  useEffect(() => {
    if (isConnected && adminWallet && !isAdmin)
      replace("/networks");
  }, [adminWallet, currentUser?.walletAddress]);

  useEffect(() => {
    if (!isConnected || !isAdmin) return;

    searchNetworks({
      isDefault: true
    })
      .then(({ rows, count }) => {
        if (count > 0)
          setDefaultNetwork(rows[0]);
      });
  }, [isConnected, isAdmin, currentUser?.walletAddress]);

  if (!isConnected)
    return <ConnectWalletButton asModal />;

  const tabs = [
    {
      eventKey: "registry",
      title: t("registry.title"),
      component: (
        <RegistrySetup 
          registryAddress={networkRegistryAddress}
          isVisible={activeTab === "registry"} 
        />
      )
    },
    {
      eventKey: "network",
      title: t("network.title"),
      component: (
        <NetworkSetup 
          isVisible={activeTab === "network"}
          defaultNetwork={defaultNetwork}
        />
      )
    },
  ];

  return(
    <Container>
      <Row className="text-center">
        <h1>{t("title")}</h1>
      </Row>

      {(isConnected && isAdmin) &&
        <Row className="mt-2">
          <TabbedNavigation
            tabs={tabs}
            className="issue-tabs"
            defaultActiveKey="registry"
            onTransition={setActiveTab}
          />
        </Row>
      }
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        "common",
        "bounty",
        "custom-network",
        "connect-wallet-button",
        "change-token-modal",
        "setup"
      ])),
    },
  };
};
