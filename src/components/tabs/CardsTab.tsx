import { useState, useEffect } from 'react';
import CardLibrary from '../cards/CardLibrary';
import FlipReview from '../cards/FlipReview';
import { getAllCards } from '../../services/storageService';
import type { User, AnkiCard } from '../../types';

interface CardsTabProps {
  user: User;
}

export default function CardsTab({ user }: CardsTabProps) {
  const [cards, setCards] = useState<AnkiCard[]>([]);
  const [reviewCards, setReviewCards] = useState<AnkiCard[] | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadCards() {
    setLoading(true);
    const c = await getAllCards(user.id);
    setCards(c);
    setLoading(false);
  }

  useEffect(() => { loadCards(); }, [user.id]);

  function handleStartReview(cardsToReview: AnkiCard[]) {
    setReviewCards(cardsToReview);
  }

  function handleExitReview(_updatedIds: string[]) {
    setReviewCards(null);
    loadCards(); // refresh statuses
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8">
      {reviewCards ? (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-th-text">Flip Review</h2>
            <p className="text-sm text-th-text-muted mt-1">{reviewCards.length} cards in this session</p>
          </div>
          <FlipReview cards={reviewCards} onExit={handleExitReview} />
        </>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-th-text">Card Library</h2>
            <p className="text-sm text-th-text-muted mt-1">
              {cards.length} flashcard{cards.length !== 1 ? 's' : ''} generated from your study sessions
            </p>
          </div>
          {loading ? (
            <div className="text-center py-12 text-th-text-faint text-sm">Loading cards...</div>
          ) : (
            <CardLibrary cards={cards} onStartReview={handleStartReview} />
          )}
        </>
      )}
    </div>
  );
}
