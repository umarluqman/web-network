import { OverlayTrigger, Popover } from "react-bootstrap";

import InfoIcon from "assets/icons/info-icon";

export default function InfoTooltip({ description = "" }) {
  const popover = (
    <Popover id="popover-tabbed-description" className="p-2 bg-white">
      <Popover.Body
        as="p"
        className="p-small-bold m-0 py-0 px-2 text-light-gray"
      >
        {description}
      </Popover.Body>
    </Popover>
  );

  return (
    <>
      <OverlayTrigger placement="bottom" overlay={popover}>
        <span className="text-white-10">
          <InfoIcon width={14} height={14} color="text-white-10" />
        </span>
      </OverlayTrigger>
    </>
  );
}