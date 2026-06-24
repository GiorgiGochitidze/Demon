import { QRCodeSVG } from "qrcode.react";

interface QrPanelProps {
  url: string;
  hunters: number;
}

export function QrPanel({ url, hunters }: QrPanelProps) {
  return (
    <div className="qr">
      <div className="qr__title">SCAN TO SEND PROPS!</div>
      <div className="qr__code">
        {url ? (
          <QRCodeSVG
            value={url}
            size={150}
            bgColor="#ffffff"
            fgColor="#05060f"
            level="M"
          />
        ) : (
          <div className="qr__placeholder">connecting…</div>
        )}
      </div>
      <div className="qr__url">{url || "—"}</div>
      <div className="qr__hunters">{hunters} hunters joined</div>
    </div>
  );
}
