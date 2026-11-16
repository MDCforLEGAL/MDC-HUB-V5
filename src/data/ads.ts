/**
 * Adsterra native banner.
 *
 * In the Adsterra dashboard open the Native Banner ad unit and copy the two
 * values from its install code:
 *
 *   <script async src="//pl00000.profitablecpmrate.com/xxxx/invoke.js"></script>
 *   <div id="container-xxxx"></div>
 *
 * Paste the script URL into `scriptSrc` and the div id into `containerId`.
 * The banner stays hidden until both values are present; set `enabled` to
 * false to switch it off completely. These are public ad-unit identifiers,
 * not account credentials.
 */
export const adsterraNativeBanner = {
  enabled: true,
  scriptSrc: "https://bauval.org/21/9c1d8417ffb646ef0744ba7bd00c7acd",
  containerId: "container-9c1d8417ffb646ef0744ba7bd00c7acd",
} as const;
