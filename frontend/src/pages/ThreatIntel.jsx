import { useState } from "react";
import api from "../services/api";

function ThreatIntel() {
const [domain, setDomain] = useState("");
const [ip, setIp] = useState("");
const [email, setEmail] = useState("");

const [domainResult, setDomainResult] = useState(null);
const [ipResult, setIpResult] = useState(null);
const [emailResult, setEmailResult] = useState(null);

const [loading, setLoading] = useState(false);

const lookupDomain = async () => {
if (!domain.trim()) return;

try {
  setLoading(true);

  const res = await api.post("/domain/lookup", {
    domain
  });

  setDomainResult(res.data);
} catch (err) {
  console.error(err);
  alert("Failed to lookup domain");
} finally {
  setLoading(false);
}

};

const lookupIp = async () => {
if (!ip.trim()) return;

try {
  setLoading(true);

  const res = await api.post("/ip/lookup", {
    ip
  });

  setIpResult(res.data);
} catch (err) {
  console.error(err);
  alert("Failed to lookup IP");
} finally {
  setLoading(false);
}

};

const analyzeEmail = async () => {
if (!email.trim()) return;

try {
  setLoading(true);

  const res = await api.post("/email/analyze", {
    email
  });

  setEmailResult(res.data);
} catch (err) {
  console.error(err);
  alert("Failed to analyze email");
} finally {
  setLoading(false);
}

};

return ( <div> <div className="page-title">
Threat Intelligence </div>


  <div className="page-subtitle">
    Domain, IP and Email Security Intelligence
  </div>

  <div className="row g-3">

    {/* DOMAIN */}
    <div className="col-lg-4">
      <div className="panel h-100">

        <div className="panel-header">
          <div className="panel-title">
            Domain Intelligence
          </div>
        </div>

        <form
          className="input-group mb-3"
          onSubmit={(e) => {
            e.preventDefault();
            lookupDomain();
          }}
        >
          <input
            className="form-control"
            placeholder="google.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />

          <button
            type="submit"
            className="btn btn-primary"
          >
            Analyze
          </button>
        </form>

        {domainResult && (
          <>
            <table className="table-dark-clean">
              <tbody>
                <tr>
                  <td>Registrar</td>
                  <td>{domainResult.whois?.registrar}</td>
                </tr>

                <tr>
                  <td>Created</td>
                  <td>{domainResult.whois?.created_date}</td>
                </tr>

                <tr>
                  <td>Expires</td>
                  <td>{domainResult.whois?.expiration_date}</td>
                </tr>

                <tr>
                  <td>Risk Score</td>
                  <td>{domainResult.risk_score}/100</td>
                </tr>
              </tbody>
            </table>

            <hr />

            <strong>A Records</strong>
            <ul>
              {(domainResult.dns?.a_records || []).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            <strong>MX Records</strong>
            <ul>
              {(domainResult.dns?.mx_records || []).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            <strong>Name Servers</strong>
            <ul>
              {(domainResult.dns?.name_servers || []).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>

    {/* IP */}
    <div className="col-lg-4">
      <div className="panel h-100">

        <div className="panel-header">
          <div className="panel-title">
            IP Intelligence
          </div>
        </div>

        <form
          className="input-group mb-3"
          onSubmit={(e) => {
            e.preventDefault();
            lookupIp();
          }}
        >
          <input
            className="form-control"
            placeholder="8.8.8.8"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
          />

          <button
            type="submit"
            className="btn btn-info"
          >
            Analyze
          </button>
        </form>

        {ipResult && (
          <table className="table-dark-clean">
            <tbody>
              <tr>
                <td>Country</td>
                <td>{ipResult.country}</td>
              </tr>

              <tr>
                <td>Region</td>
                <td>{ipResult.region}</td>
              </tr>

              <tr>
                <td>City</td>
                <td>{ipResult.city}</td>
              </tr>

              <tr>
                <td>ISP</td>
                <td>{ipResult.isp}</td>
              </tr>

              <tr>
                <td>Organization</td>
                <td>{ipResult.organization}</td>
              </tr>

              <tr>
                <td>ASN</td>
                <td>{ipResult.asn}</td>
              </tr>

              <tr>
                <td>Reverse DNS</td>
                <td>{ipResult.reverse_dns}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>

    {/* EMAIL */}
    <div className="col-lg-4">
      <div className="panel h-100">

        <div className="panel-header">
          <div className="panel-title">
            Email Intelligence
          </div>
        </div>

        <form
          className="input-group mb-3"
          onSubmit={(e) => {
            e.preventDefault();
            analyzeEmail();
          }}
        >
          <input
            className="form-control"
            placeholder="security@google.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            className="btn btn-success"
          >
            Analyze
          </button>
        </form>

        {emailResult && (
          <table className="table-dark-clean">
            <tbody>
              <tr>
                <td>Email</td>
                <td>{emailResult.email}</td>
              </tr>

              <tr>
                <td>Domain</td>
                <td>{emailResult.domain}</td>
              </tr>

              <tr>
                <td>Provider Type</td>
                <td>{emailResult.provider_type}</td>
                </tr>

                <tr>
                <td>MX Records</td>
                <td>
                    {emailResult.mx_records?.length > 0
                    ? "Present"
                    : "Missing"}
                </td>
                </tr>

                <tr>
                <td>SPF</td>
                <td>
                    {emailResult.spf_present
                    ? "Present"
                    : "Missing"}
                </td>
                </tr>

                <tr>
                <td>DMARC</td>
                <td>
                    {emailResult.dmarc_present
                    ? "Present"
                    : "Missing"}
                </td>
                </tr>



              <tr>
                <td>Security Score</td>
                <td>
                  {emailResult.security_score}/100
                </td>
              </tr>

              <tr>
                <td>Risk Rating</td>
                <td>
                  {emailResult.risk_rating}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>

  </div>

  {loading && (
    <div className="mt-3 text-muted">
      Loading...
    </div>
  )}
</div>

);
}

export default ThreatIntel;
