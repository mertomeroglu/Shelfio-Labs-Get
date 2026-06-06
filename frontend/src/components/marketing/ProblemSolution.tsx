import { problemCards, solutionCards } from "@/config/home";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export function ProblemSolution() {
  return (
    <section className="section problem-solution">
      <Container className="problem-solution__grid">
        <div>
          <p className="eyebrow">Problem</p>
          <h2>Mağaza operasyonları büyüdükçe kontrol zorlaşır.</h2>
          <div className="point-list">
            {problemCards.map((problem) => (
              <Card className="point-card point-card--problem" key={problem} padding="sm">
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">
                    <path d="M12 9v4m0 4h.01M10.3 4.5 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0Z" />
                  </svg>
                </span>
                <p>{problem}</p>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <p className="eyebrow">Çözüm</p>
          <h2>Shelfio tüm operasyonu tek akışta toplar.</h2>
          <div className="point-list">
            {solutionCards.map((solution) => (
              <Card className="point-card point-card--solution" key={solution} padding="sm">
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">
                    <path d="m20 6-11 11-5-5" />
                  </svg>
                </span>
                <p>{solution}</p>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
