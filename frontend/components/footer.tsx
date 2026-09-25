export default function Footer() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
      <p className="text-xs">
        Times shown in Philippine time (Asia/Manila). This page updates
        automatically every minute.
      </p>
      <p className="text-xs">
        A slot shows as{" "}
        <span className="font-semibold">Booked</span> once a
        reservation with proof of payment is received.
      </p>
    </div>
  );
}
