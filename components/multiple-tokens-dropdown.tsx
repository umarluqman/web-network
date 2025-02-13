import { useEffect, useState } from "react";
import { OnChangeValue } from "react-select";
import CreatableSelect from "react-select/creatable";

import { useTranslation } from "next-i18next";


import ChangeTokenModal from "components/change-token-modal";


import { Token } from "interfaces/token";

interface Option {
  label: string;
  value: Token;
  __isNew__?: boolean;
}

export default function MultipleTokensDropdown({
  label,
  description = undefined,
  addToken,
  tokens,
  selectedTokens,
  canAddToken,
  changeSelectedTokens,
  isloading = false,
}) {
  const [options, setOptions] = useState<Option[]>();
  const [selectedOptions, setSelectedOptions] = useState<Option[] | OnChangeValue<Option, true>>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { t } = useTranslation("common");

  const tokenToOption = (token: Token): Option => ({
    label: `${token?.tokenInfo ? token.tokenInfo.name : token?.symbol}`,
    value: token,
  });

  const handleChange = (newValue: OnChangeValue<Option, true>) => {
    setSelectedOptions(newValue);
    changeSelectedTokens &&
      changeSelectedTokens(newValue.map(({ value }) => value));
  };

  useEffect(() => {
    if (!tokens?.length) return;
    else setOptions(tokens.map(tokenToOption));
  }, [tokens]);

  useEffect(() => {
    if (!selectedTokens?.length) return;

    setSelectedOptions(selectedTokens?.map(tokenToOption));
  }, [selectedTokens]);

  const formatCreateLabel = (inputValue: string) =>
    canAddToken
      ? `${t("misc.add")} ${inputValue} ${t("misc.token")}`
      : undefined;

  function SelectOptionComponent({ innerProps, innerRef, data }) {
    return (
      <div
        ref={innerRef}
        {...innerProps}
        disabled
        className={`proposal__select-options d-flex align-items-center text-center p-small p-1 my-1
        `}
      >
        {data?.__isNew__ ? (
          <div className="mx-2">{formatCreateLabel(data?.value)}</div>
        ) : (
          <span className="mx-2">{data?.value?.symbol}</span>
        )}
      </div>
    );
  }

  function handleOnCreateOption(value) {
    if (!canAddToken) return;

    if (value) setIsModalVisible(true);
  }

  return (
    <div className="form-group">
      <label className="caption-small mb-2">{label || t("misc.token")}</label>
      <CreatableSelect
        className="react-select-container"
        classNamePrefix="react-select"
        isMulti
        onChange={handleChange}
        onCreateOption={handleOnCreateOption}
        options={options}
        components={{
          Option: SelectOptionComponent,
        }}
        value={selectedOptions}
        isLoading={isloading}
      />
      <ChangeTokenModal
        show={isModalVisible}
        description={description}
        setToken={addToken}
        setClose={() => setIsModalVisible(false)}
      />
    </div>
  );
}
