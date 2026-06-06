import { dashboardTasks } from "@/config/home";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function DashboardPreview() {
  return (
    <section className="section dashboard-section">
      <Container>
        <SectionHeader
          align="center"
          description="Shelfio, operasyon verisini tek ekranda anlaşılır sinyallere dönüştürmek için tasarlanır."
          eyebrow="Ürün önizleme"
          title="Operasyon verisini sadece göstermeyin, karar aldırın."
        />
        <Card className="dashboard-preview" padding="lg">
          <div className="dashboard-preview__header">
            <div>
              <p className="eyebrow">Mağaza operasyon paneli</p>
              <h3>Bugünkü öncelikler</h3>
            </div>
            <Badge variant="success">Aktif lisans</Badge>
          </div>
          <div className="dashboard-preview__grid">
            <div className="preview-kpis">
              <Card padding="sm" variant="tinted">
                <span>Kritik stok</span>
                <strong>34 ürün</strong>
                <p>12 ürün için sipariş önerisi hazır.</p>
              </Card>
              <Card padding="sm" variant="tinted">
                <span>Bekleyen satın alma</span>
                <strong>8 sipariş</strong>
                <p>3 tedarikçi teslim zamanı bekliyor.</p>
              </Card>
              <Card padding="sm" variant="tinted">
                <span>Reyon doluluk</span>
                <strong>%82</strong>
                <div className="progress-bar">
                  <span style={{ width: "82%" }} />
                </div>
              </Card>
            </div>
            <div className="preview-chart">
              <div className="preview-chart__top">
                <div>
                  <span>Haftalık satış trendi</span>
                  <strong>₺312.400</strong>
                </div>
                <Badge variant="success">+%18</Badge>
              </div>
              <div className="trend-chart" aria-label="Haftalık satış trendi">
                <svg viewBox="0 0 420 180" role="img">
                  <path className="trend-chart__grid" d="M20 38h380M20 82h380M20 126h380" />
                  <path className="trend-chart__area" d="M20 128 C70 116 86 96 132 104 C178 112 188 58 238 70 C288 82 306 38 358 50 C382 56 398 42 400 38 L400 160 L20 160Z" />
                  <path className="trend-chart__line" d="M20 128 C70 116 86 96 132 104 C178 112 188 58 238 70 C288 82 306 38 358 50 C382 56 398 42 400 38" />
                  <circle cx="238" cy="70" r="5" />
                  <circle cx="400" cy="38" r="5" />
                </svg>
              </div>
              <div className="stock-bars" aria-label="Stok seviyesi">
                <div><span style={{ height: "64%" }} /><strong>Gıda</strong></div>
                <div><span style={{ height: "82%" }} /><strong>İçecek</strong></div>
                <div><span style={{ height: "38%" }} /><strong>Temizlik</strong></div>
                <div><span style={{ height: "72%" }} /><strong>Bakım</strong></div>
              </div>
              <div className="critical-segments" aria-label="Kritik stok segmentleri">
                <span className="is-danger">12 kritik</span>
                <span className="is-warning">22 izleme</span>
                <span className="is-success">148 sağlıklı</span>
              </div>
            </div>
            <div className="task-preview">
              {dashboardTasks.map((task) => (
                <div className="task-row" key={task.label}>
                  <p>{task.label}</p>
                  <Badge variant={task.status === "Tamamlandı" ? "success" : "neutral"}>{task.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </Container>
    </section>
  );
}
