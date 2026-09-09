/**
 * The Clause & Code robot on its broom — the loading screen's rider, as a
 * single white line drawing. Drawn once; the page moves it.
 */
export default function BroomRobot({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 700 773" className={className} style={style} aria-hidden>
      <g fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="296" cy="30" r="19"/>
      <path d="M302 49 L318 150"/>
      <path d="M242 292 C214 220 236 108 350 90 C450 74 522 112 506 218 C500 262 486 318 468 340 C446 366 400 366 352 360 C300 354 258 336 242 292 Z"/>
      <path d="M440 130 C482 140 498 186 496 240 C494 292 482 324 460 332 C468 262 464 190 440 130 Z"/>
      <ellipse cx="480" cy="214" rx="9" ry="17" fill="#fff" stroke="none"/>
      <path d="M474 262 Q486 272 496 256"/>
      <circle cx="326" cy="212" r="52"/>
      <circle cx="326" cy="212" r="34"/>
      <path d="M356 360 L358 384 M392 358 L392 384"/>
      <path d="M340 386 C360 380 388 380 408 386"/>
      <path d="M300 396 C288 440 292 500 314 540 L440 546 C452 500 452 440 436 392 C400 382 340 382 300 396 Z"/>
      <path d="M296 462 C340 452 400 452 446 460"/>
      <path d="M306 412 C300 446 332 462 362 462 C392 462 414 470 428 484"/>
      <path d="M336 396 C344 428 372 440 400 440 C424 440 448 452 462 470"/>
      <path d="M428 484 C462 500 500 508 530 512"/>
      <path d="M462 470 C492 478 526 486 552 494"/>
      <path d="M530 512 C520 528 530 548 552 550 C578 552 588 530 578 508 C570 490 550 488 540 496"/>
      <path d="M290 606 L688 462 L692 476 L296 620 Z"/>
      <path d="M296 592 C276 588 266 616 282 626"/>
      <path d="M284 590 C220 556 120 552 40 580 C18 590 8 610 14 630 C20 656 44 690 76 716 C100 736 124 752 148 758 C176 742 220 700 256 664 C270 650 286 636 296 622"/>
      <path d="M282 604 C210 604 130 620 70 650"/>
      <path d="M284 614 C216 634 148 672 98 716"/>
      <path d="M40 590 C46 640 70 690 110 730"/>
      <path d="M96 584 C88 636 100 690 128 736"/>
      <path d="M150 584 C140 630 148 676 172 712"/>
      <path d="M204 588 C194 624 200 656 220 684"/>
      <path d="M322 540 C318 586 340 630 372 652 L398 640 C378 614 366 580 370 548"/>
      <path d="M372 652 C356 664 340 676 344 690 C366 698 396 690 404 680 L398 640"/>
      <path d="M416 546 C424 596 466 636 500 652 L522 630 C496 606 470 570 466 548"/>
      <path d="M500 652 C518 668 556 690 578 672 C566 654 544 640 522 630"/>
      </g>
    </svg>
  )
}
