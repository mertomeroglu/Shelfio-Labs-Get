import { operationFlow } from "@/config/modules";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";

const flowDescriptions = [
  "Ürün kartı ve barkod temeli kurulur.",
  "Depo ve reyon miktarları izlenir.",
  "Kasa satışı operasyonu tetikler.",
  "Satışla stok otomatik azalır.",
  "Kritik seviyeler siparişe dönüşür.",
  "Tedarik süreci başlatılır.",
  "Gelen ürün kontrollü işlenir.",
  "Reyon ihtiyacı tamamlanır.",
  "Tüm zincir rapora yansır.",
] as const;

export function OperationFlow() {
  return (
    <section className="section operation-flow-section">
      <Container>
        <SectionHeader
          align="center"
          description="Bir satış yalnızca kasa işlemi değildir; stok, sipariş, mal kabul ve raporlama zincirini de etkiler."
          eyebrow="Operasyon akışı"
          title="Satıştan tedarike kadar operasyon tek veri akışına bağlanır."
        />
        <div className="operation-flow">
          {operationFlow.map((step, index) => (
            <div className={`operation-flow__step operation-flow__step--${index + 1}`} key={step}>
              <span className="operation-flow__number">{index + 1}</span>
              <div>
                <p>{step}</p>
                <small>{flowDescriptions[index]}</small>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
