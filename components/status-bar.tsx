import {useContext, useEffect, useState,} from 'react';
import {ApplicationContext} from '@contexts/application';
import {changeMicroServiceReady} from '@reducers/change-microservice-ready';
import GithubMicroService from '@services/github-microservice';
import Link from 'next/link';

export default function StatusBar() {
  const {dispatch, state: {microServiceReady}} = useContext(ApplicationContext);
  const [ms, setMs] = useState(0);

  function neverEndingUpdate() {
    const past = +new Date();
    GithubMicroService.getHealth()
                      .then(state => {
                        dispatch(changeMicroServiceReady(state))
                        setMs(+new Date() - past);
                        setTimeout(neverEndingUpdate, 60*1000)
                      })
  }

  function renderNetworkStatus() {
    let info;

    if (microServiceReady === null)
      info = [`white-50`, `waiting`];
    else if (microServiceReady === false)
      info = [`danger`, `network problems`]
    else
      info = ms <= 200 ? [`success`, `operational`] : ms <= 500 ? [`warning`, `network congestion`] : [`orange`, `network congestion`];

    const indicatorStyle = {height: `.5rem`, width: `.5rem`};
    const indicatorClass = `d-inline-block me-2 rounded bg-${info[0]}`

    return <div>
      <span className={indicatorClass} style={indicatorStyle} />
      <span className="text-uppercase fs-7">{info[1]} {ms}ms</span>
    </div>
  }

  useEffect(neverEndingUpdate, []);

  return (<>
    <div className="position-fixed bg-dark bottom-0 w-100 px-3 py-1 d-flex" id="status-bar">
      <div className="d-flex align-items-center w-100">
        {renderNetworkStatus()}
        <div className="ms-3">|</div>
        <div className="ms-3 flex-grow-1 text-center fs-7 text-uppercase family-Regular">
          Bepro Network Services and BEPRO Token ($BEPRO) are not available in Excluded Jurisdictions. By accessing and using the interface you agree with our <a href="https://www.bepro.network/terms-and-conditions" className="text-decoration-none">{`Terms & Conditions`}</a>
        </div>
      </div>

    </div>
  </>)

}