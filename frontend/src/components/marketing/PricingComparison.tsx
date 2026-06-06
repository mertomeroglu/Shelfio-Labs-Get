import { planComparisonRows } from "@/config/plans";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";

function renderCell(value: string | boolean) {
  if (value === true) return <span className="comparison-status comparison-status--yes"><span aria-hidden="true">✓</span> Var</span>;
  if (value === false) return <span className="comparison-status comparison-status--no"><span aria-hidden="true">×</span> Yok</span>;
  if (value === "Hazırlık") return <span className="comparison-status comparison-status--prep"><span aria-hidden="true">●</span> Hazırlık</span>;
  return <span className="comparison-badge">{value}</span>;
}

export function PricingComparison() {
  return (
    <section className="section section--soft" id="plan-karsilastirma">
      <Container>
        <SectionHeader
          description="Modül kapsamını ve destek seviyelerini planlara göre hızlıca karşılaştırın."
          eyebrow="Karşılaştırma"
          title="Plan bazlı erişim ve kapsam"
        />
        <Card className="comparison-card" padding="sm">
          <div className="comparison-table-wrap">
            <table className="comparison-table" aria-label="Plan karşılaştırma tablosu">
              <thead>
                <tr>
                  <th>Özellik</th>
                  <th>Başlangıç</th>
                  <th className="is-highlighted">Profesyonel</th>
                  <th>Kurumsal</th>
                </tr>
              </thead>
              <tbody>
                {planComparisonRows.map((row) => (
                  <tr key={row.feature}>
                    <th scope="row">{row.feature}</th>
                    <td>{renderCell(row.starter)}</td>
                    <td className="is-highlighted">{renderCell(row.professional)}</td>
                    <td>{renderCell(row.enterprise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Container>
    </section>
  );
}
