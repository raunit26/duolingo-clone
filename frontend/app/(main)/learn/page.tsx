"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { CourseOut, SkillOut } from "@/lib/types";
import { UnitBanner } from "@/components/path/UnitBanner";
import { SkillNode } from "@/components/path/SkillNode";
import { Mascot } from "@/components/ui/Mascot";

function offsetForIndex(i: number) {
  // A gentle organic wave, reminiscent of Duolingo's winding path.
  return Math.round(Math.sin(i * 1.05) * 78);
}

export default function LearnPage() {
  const router = useRouter();
  const [course, setCourse] = useState<CourseOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCourse().then((c) => {
      setCourse(c);
      setLoading(false);
    });
  }, []);

  const nextSkillId = useMemo(() => {
    if (!course) return null;
    for (const unit of course.units) {
      for (const skill of unit.skills) {
        if (skill.status === "available" && skill.crowns === 0) return skill.id;
      }
    }
    return null;
  }, [course]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Mascot mood="neutral" className="h-20 w-20 animate-pop-in" />
      </div>
    );
  }
  if (!course) return null;

  let globalIndex = 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Mascot mood="excited" className="h-16 w-16" />
        <h1 className="font-display text-2xl font-extrabold">{course.language_name} Path</h1>
        <p className="text-sm text-wolf">Follow the path, complete lessons, earn crowns 👑</p>
      </div>

      {course.units.map((unit) => (
        <section key={unit.id} className="mb-12">
          <div className="mb-10">
            <UnitBanner title={unit.title} description={unit.description} colorTheme={unit.color_theme} />
          </div>
          <div className="flex flex-col items-center gap-8">
            {unit.skills.map((skill: SkillOut) => {
              const idx = globalIndex++;
              return (
                <SkillNode
                  key={skill.id}
                  skill={skill}
                  colorTheme={unit.color_theme}
                  offsetX={offsetForIndex(idx)}
                  isNext={skill.id === nextSkillId}
                  onClick={() => router.push(`/lesson/${skill.id}`)}
                />
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex flex-col items-center gap-2 pb-8 pt-4 text-center text-wolf">
        <Mascot mood="happy" className="h-14 w-14 opacity-70" />
        <p className="text-sm font-bold">More units coming soon!</p>
      </div>
    </div>
  );
}
