"use client";

import { useEffect, useState } from "react";
import { SidebarCard } from "./SidebarCard";
import { getPageCards } from "~/server/queries/card";
import { SidebarGroup } from "~/components/ui/sidebar";
import { Card } from "~/server/queries/card";
import { TreeTag } from "~/server/queries/usersTags";
import CardSkeleton from "./CardSkeleton";

interface CardListProps {
  pageId: string;
  userTagTree: TreeTag[];
  isMobile: boolean;
}

export function CardList({ pageId, userTagTree, isMobile }: CardListProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCards = async () => {
      try {
        const pageCards = await getPageCards(pageId);
        setCards(pageCards);
      } catch (error) {
        console.error("Error loading cards:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCards();
  }, [pageId]);

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (!cards.length) {
    return <div className="p-4">No cards found</div>;
  }

  return (
    <SidebarGroup>
      <div className="space-y-4 p-4">
        <div className="space-y-4">
          {cards.map((card) => (
            <SidebarCard
              key={card.id}
              {...card}
              userTagTree={userTagTree}
              tags={card.tags.map((tag) => ({
                id: tag.id,
                name: tag.name,
                parent_id: tag.parent_id,
                created_at: tag.created_at,
                updated_at: tag.updated_at,
                deleted: tag.deleted,
                is_template: tag.is_template ?? false,
              }))}
              currentCardId={card.id}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>
    </SidebarGroup>
  );
}
