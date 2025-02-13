import {useRouter} from "next/router";
import {UrlObject} from "url";

import {useAppState} from "contexts/app-state";

import {hexadecimalToRGB} from "helpers/colors";

import {ThemeColors} from "interfaces/network";

export default function useNetworkTheme() {
  const router = useRouter();

  const {state} = useAppState();

  function DefaultTheme(): ThemeColors {
    return {
      primary: getComputedStyle(document.documentElement).getPropertyValue("--bs-primary").trim(),
      secondary: getComputedStyle(document.documentElement).getPropertyValue("--bs-secondary").trim(),
      oracle: getComputedStyle(document.documentElement).getPropertyValue("--bs-purple").trim(),
      text: getComputedStyle(document.documentElement).getPropertyValue("--bs-body-color").trim(),
      background: getComputedStyle(document.documentElement).getPropertyValue("--bs-body-bg").trim(),
      shadow: getComputedStyle(document.documentElement).getPropertyValue("--bs-shadow").trim(),
      gray: getComputedStyle(document.documentElement).getPropertyValue("--bs-gray").trim(),
      success: getComputedStyle(document.documentElement).getPropertyValue("--bs-success").trim(),
      danger: getComputedStyle(document.documentElement).getPropertyValue("--bs-danger").trim(),
      warning: getComputedStyle(document.documentElement).getPropertyValue("--bs-warning").trim(),
      info: getComputedStyle(document.documentElement).getPropertyValue("--bs-info").trim(),
      dark: getComputedStyle(document.documentElement).getPropertyValue("--bs-dark").trim(),
    };
  }

  function colorsToCSS(overrideColors = undefined as ThemeColors): string {
    if (!state.Service?.network?.active || (!state.Service?.network?.active?.colors && !overrideColors)) return "";

    const colors = {
      text: overrideColors?.text || state.Service?.network?.active.colors?.text,
      background: overrideColors?.background || state.Service?.network?.active.colors?.background,
      shadow: overrideColors?.shadow || state.Service?.network?.active.colors?.shadow,
      gray: overrideColors?.gray || state.Service?.network?.active.colors?.gray,
      primary: overrideColors?.primary || state.Service?.network?.active.colors?.primary,
      secondary: overrideColors?.secondary || state.Service?.network?.active.colors?.secondary,
      oracle: overrideColors?.oracle || state.Service?.network?.active.colors?.oracle,
      success: overrideColors?.success || state.Service?.network?.active.colors?.success,
      danger: overrideColors?.danger || state.Service?.network?.active.colors?.danger,
      warning: overrideColors?.warning || state.Service?.network?.active.colors?.warning,
      info: overrideColors?.info || state.Service?.network?.active.colors?.info,
      dark: overrideColors?.dark || state.Service?.network?.active.colors?.dark,
    };

    return `:root {
      --bs-bg-opacity: 1;
      ${
        (colors.gray &&
          `--bs-gray: ${colors.gray}; --bs-gray-rgb: ${hexadecimalToRGB(colors.gray).join(",")};`) ||
        ""
      }
      ${
        (colors.danger &&
          `--bs-danger: ${colors.danger}; --bs-danger-rgb: ${hexadecimalToRGB(colors.danger).join(",")};`) ||
        ""
      }
      ${
        (colors.shadow &&
          `--bs-shadow: ${colors.shadow}; --bs-shadow-rgb: ${hexadecimalToRGB(colors.shadow).join(",")};`) ||
        ""
      }
      ${
        (colors.oracle &&
          `--bs-purple: ${colors.oracle}; --bs-purple-rgb: ${hexadecimalToRGB(colors.oracle).join(",")};`) ||
        ""
      }
      ${
        (colors.text &&
          `--bs-body-color: ${
            colors.text
          }; --bs-body-color-rgb: ${hexadecimalToRGB(colors.text).join(",")};`) ||
        ""
      }
      ${
        (colors.primary &&
          `--bs-primary: ${
            colors.primary
          }; --bs-primary-rgb: ${hexadecimalToRGB(colors.primary).join(",")};`) ||
        ""
      }
      ${
        (colors.success &&
          `--bs-success: ${
            colors.success
          }; --bs-success-rgb: ${hexadecimalToRGB(colors.success).join(",")};`) ||
        ""
      }
      ${
        (colors.warning &&
          `--bs-warning: ${
            colors.warning
          }; --bs-warning-rgb: ${hexadecimalToRGB(colors.warning).join(",")};`) ||
        ""
      }
      ${
        (colors.secondary &&
          `--bs-secondary: ${
            colors.secondary
          }; --bs-secondary-rgb: ${hexadecimalToRGB(colors.secondary).join(",")};`) ||
        ""
      }
      ${
        (colors.background &&
          `--bs-body-bg: ${
            colors.background
          }; --bs-body-bg-rgb: ${hexadecimalToRGB(colors.background).join(",")};`) ||
        ""
      }
      ${
        (colors.info &&
          `--bs-info: ${
            colors.info
          }; --bs-info-rgb: ${hexadecimalToRGB(colors.info).join(",")};`) ||
        ""
      }
      ${
        (colors.dark &&
          `--bs-dark: ${
            colors.dark
          }; --bs-dark-rgb: ${hexadecimalToRGB(colors.dark).join(",")};`) ||
        ""
      }
    }`;
  }

  function changeNetwork(newNetwork: string): void {
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        network: newNetwork
      }
    });
  }

  function getURLWithNetwork(href: string, query = undefined): UrlObject {
    return {
      pathname: `/[network]/${href}`.replace("//", "/"),
      query: {
        ...query,
        network: query?.network || 
                 router?.query?.network || 
                 state?.Service?.network?.active?.name
      }
    };
  }

  return {
    colorsToCSS,
    DefaultTheme,
    getURLWithNetwork,
    setNetwork: changeNetwork
  };
}
