<html lang="en" class="h-full"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"><meta http-equiv="X-UA-Compatible" content="ie=edge"><title>
	NACCL Puzzle
</title><link rel="apple-touch-icon" sizes="180x180" href="images/favicon/apple-touch-icon.png"><link rel="icon" type="image/png" sizes="32x32" href="images/favicon/favicon-32x32.png"><link rel="icon" type="image/png" sizes="16x16" href="images/favicon/favicon-16x16.png"><link rel="manifest" href="images/favicon/site.webmanifest.json"><meta property="og:locale" content="en_US"><meta property="og:type" content="website"><meta property="og:title" content="NACCL Puzzle"><meta property="og:description" content="Tactical chess puzzles drawn from real NACCL games. Solve, rate, climb the leaderboard."><meta property="og:site_name" content="nacorporatechess"><link rel="stylesheet" href="styles/output.css"><link rel="stylesheet" href="styles/custom.css">
    <script src="js/jquery-3.7.1/jquery.min.js"></script>
    <script defer="" src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.8/dist/cdn.min.js"></script>

    
    <link rel="stylesheet" href="https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js"></script>
    <script src="https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.js"></script>
    <style>
        /* Fullscreen desktop layout: use full viewport width with a fixed
           left column so the board stays a reasonable size and the panels
           expand to fill the rest. Board fixed at 400px so the entire UI
           (board + controls + status) fits within a typical viewport
           after the master-page header without requiring scroll. */
        /* puzzle-main now lives inside the NACCL-style white rounded panel
           so we drop our own horizontal padding and let the panel handle it. */
        main.puzzle-main { width: 100%; max-width: none; margin: 0; padding: 0; display: grid; grid-template-columns: 510px 1fr; gap: 24px; box-sizing: border-box; }
        @media (max-width: 900px) { main.puzzle-main { grid-template-columns: 1fr; gap: 8px; } }
        #board { width: 480px; max-width: 100%; }
        @media (max-width: 600px) {
            #board { width: 100%; }
            main.puzzle-main section { width: 100%; }
            main.puzzle-main { grid-template-columns: 1fr; }
        }
        .panel { background: #fff; border: 1px solid #e2e2e2; border-radius: 8px; padding: 16px 18px; }
        .panel + .panel { margin-top: 14px; }
        .panel h3 { margin: 0 0 10px; font-size: 14px; color: #333; font-weight: 600; }
        .meta { font-size: 13px; color: #333; }
        .meta-event { padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; margin-bottom: 8px; color: #555; }
        .meta-event b { color: #2d3142; font-size: 14px; }
        .meta-event .game-link { float: right; color: #5d82a8; text-decoration: none; font-size: 12px; }
        .meta-event .game-link:hover { text-decoration: underline; }
        .meta-roster .player { display: flex; align-items: center; gap: 8px; padding: 4px 0; flex-wrap: wrap; }
        .meta-roster .player .dot { font-size: 18px; line-height: 1; width: 18px; text-align: center; }
        .meta-roster .player.white .dot { color: #2d3142; }
        .meta-roster .player.black .dot { color: #2d3142; }
        .meta-roster .player .name { font-weight: 600; color: #2d3142; }
        .meta-roster .player .team { background: #5d82a8; color: #fff; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 10px; letter-spacing: 0.3px; }
        .meta-roster .player .handle { color: #888; font-size: 12px; font-family: ui-monospace, "Cascadia Mono", Menlo, monospace; }
        .pill { display: inline-block; background: #eef0f4; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-right: 4px; color: #444; }
        .pill.level { background: #d6e6ff; color: #1a4ea0; font-weight: 600; }
        button.primary { background: #2d3142; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; }
        button.primary:hover { background: #1d2030; }
        button.primary:disabled { background: #888; cursor: wait; }
        button.secondary { background: #fff; border: 1px solid #ccc; padding: 7px 13px; border-radius: 4px; cursor: pointer; font-size: 13px; }
        button.secondary:hover { background: #f0f0f0; }
        select { padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; }
        .status { font-size: 14px; padding: 10px 12px; border-radius: 4px; margin-top: 10px; }
        .status.ok { background: #e6f7ec; color: #1a7f37; }
        .status.bad { background: #fdebec; color: #cf222e; }
        .status.info { background: #eef4fb; color: #1a4ea0; }
        .controls-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 8px; }
        /* NACCL board theme: cream light squares, lighter NACCL blue darks. */
        .white-1e1d7 { background-color: #eeeed2 !important; color: #5D82A8 !important; }
        .black-3c85d { background-color: #5D82A8 !important; color: #eeeed2 !important; }
        /* Last-move highlight: subtle yellow tint on from + to squares.
           Uses inset box-shadow so it overlays the normal square color
           without fighting the !important rules above. */
        .highlight-last-move {
            box-shadow: inset 0 0 0 4px rgba(255, 217, 0, 0.7) !important;
        }
        /* Wrapper that hosts the SVG arrow overlay above the board.
           Also hosts the eval bar to the left of the board. */
        #boardWrap { position: relative; width: 480px; max-width: 100%; }
        #boardWithBar { display: flex; gap: 6px; align-items: stretch; }
        #boardArrows {
            position: absolute; top: 0; left: 0;
            width: 100%; height: 100%;
            pointer-events: none;
            z-index: 5;
        }
        /* Vertical eval bar (Lichess-style) shown alongside the board
           during analysis mode. White = top, black = bottom. The fill div
           is sized as a percentage of the parent (always sums to 100%). */
        #evalBar {
            display: none;
            width: 18px;
            min-height: 480px;
            background: #2d3142;
            border-radius: 2px;
            position: relative;
            overflow: hidden;
        }
        #evalBarFill {
            position: absolute; bottom: 0; left: 0; right: 0;
            background: #f5f5f5;
            transition: height 0.25s ease;
        }
        #evalBarText {
            position: absolute; left: 0; right: 0;
            top: 50%; transform: translateY(-50%);
            color: #5d82a8; font-size: 9px; text-align: center;
            font-family: ui-monospace, "Cascadia Mono", Menlo, monospace;
            font-weight: 600; pointer-events: none;
            text-shadow: 0 0 2px rgba(255,255,255,0.7);
        }
        /* Hint highlight: yellow ring on the from-square only (vs full
           last-move highlight which covers from + to). */
        .highlight-hint {
            box-shadow: inset 0 0 0 4px rgba(255, 200, 0, 0.85) !important;
        }
        /* Click-to-move source-square highlight. NACCL red so it reads as
           "I picked this up" rather than a hint. */
        .highlight-selected {
            box-shadow: inset 0 0 0 4px rgba(163, 69, 48, 0.85) !important;
        }
        /* Outcome modal -- shows after each puzzle attempt with a big
           visible Correct/Wrong result. */
        .outcome-modal {
            position: fixed; inset: 0; z-index: 100;
            display: flex; align-items: center; justify-content: center;
            padding: 16px;
        }
        .outcome-modal-backdrop {
            position: absolute; inset: 0; background: rgba(0,0,0,0.45);
        }
        .outcome-modal-card {
            position: relative; background: #fff; border-radius: 16px;
            padding: 28px 32px; max-width: 380px; width: 100%; text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.25);
        }
        .outcome-modal-icon { font-size: 56px; line-height: 1; margin-bottom: 4px; }
        .outcome-modal-icon.ok  { color: #1a7f37; }
        .outcome-modal-icon.bad { color: #cf222e; }
        .outcome-modal-title { margin: 4px 0 6px; font-size: 24px; font-weight: 700; }
        .outcome-modal-title.ok  { color: #1a7f37; }
        .outcome-modal-title.bad { color: #cf222e; }
        .outcome-modal-meta { margin: 0 0 18px; color: #555; font-size: 13px; line-height: 1.5; }
        .outcome-modal-meta b { color: #2d3142; }
        .outcome-modal-actions { display: flex; gap: 8px; justify-content: center; }
        .outcome-modal-actions button { min-width: 110px; }
        /* Tab navigation (Random / History / Stats). Plain rounded buttons. */
        .tab-nav { display: flex; gap: 6px; margin-bottom: 12px; }
        .tab-nav button {
            background: #fff; border: 1px solid #ccc; padding: 6px 14px;
            border-radius: 4px; cursor: pointer; font-size: 13px;
            color: #333;
        }
        .tab-nav button:hover { background: #f5f5f5; }
        .tab-nav button.active { background: #2d3142; color: #fff; border-color: #2d3142; font-weight: 600; }
        .history-list { max-height: 460px; overflow-y: auto; }
        .history-row {
            padding: 8px 10px; border-bottom: 1px solid #f0f0f0;
            cursor: pointer; font-size: 13px;
            display: flex; align-items: center; gap: 10px;
        }
        .history-row:hover { background: #f7f9fc; }
        .history-row .badge { background: #d6e6ff; color: #1a4ea0; padding: 2px 6px; border-radius: 8px; font-size: 11px; font-weight: 600; }
        .history-row .badge.solved { background: #e6f7ec; color: #1a7f37; }
        .history-row .badge.failed { background: #fdebec; color: #cf222e; }
        /* Theme stats bar chart. */
        .theme-stats-row { padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
        .theme-stats-row .name { display: inline-block; min-width: 130px; font-weight: 600; }
        .theme-stats-row .bar {
            display: inline-block; width: 200px; height: 10px; background: #f0f0f0;
            border-radius: 5px; overflow: hidden; vertical-align: middle; margin: 0 8px;
        }
        .theme-stats-row .bar-fill {
            height: 100%; background: linear-gradient(90deg, #cf222e, #d4ad32, #1a7f37);
        }
        .theme-stats-row .pct { color: #555; font-family: monospace; }
        /* Streak indicator at top of board panel. */
        #streakBox {
            font-size: 12px; color: #555; padding: 6px 10px;
            background: #f7f9fc; border-radius: 4px; margin-bottom: 8px;
            display: none;
        }
        #streakBox b { color: #2d3142; }
        #streakBox .streak-fire { color: #d4ad32; font-weight: 700; }
        /* Hide the page-level vertical scrollbar but keep scrolling working
           (mouse wheel / arrow keys still scroll). Cross-browser. */
        html, body { scrollbar-width: none; -ms-overflow-style: none; }
        html::-webkit-scrollbar, body::-webkit-scrollbar { width: 0; height: 0; display: none; }
        /* Override the NACCL gray gradient so its bottom edge fades to white,
           hiding the visible cut where it meets the body's white background. */
        .custom-gray-bg-2::before {
            background: linear-gradient(-180deg, rgba(248, 246, 245, 1) 0%, rgba(255, 255, 255, 1) 100%) !important;
        }

        /* ===================================================================
           MOBILE: guard against horizontal overflow.
           =================================================================== */
        @media (max-width: 640px) {
            /* Page-level: never allow horizontal scroll. */
            html, body { overflow-x: hidden; }

            /* Hero: tighten line-height + add safe margin. */
            h1.tracking-wide { line-height: 1.1; }

            /* White panel: less side padding so the board has more room. */
            main.puzzle-main { padding: 0 !important; }

            /* Board column: full-width, scale board to viewport. */
            #boardWithBar { width: 100%; }
            #boardWrap { width: 100% !important; max-width: 100% !important; }
            #board { width: 100% !important; }

            /* When eval bar is showing in analyze mode, shrink it horizontally. */
            #evalBar { min-height: 0 !important; }

            /* Panel padding tighter. */
            .panel { padding: 12px; }

            /* Tab buttons: smaller padding, wrap if needed. */
            .tab-nav { flex-wrap: wrap; }
            .tab-nav button { padding: 5px 10px; font-size: 12px; }

            /* Engine analysis FEN: allow it to break across lines. */
            #analysisFen { display: block; word-break: break-all; margin-top: 4px; font-size: 10px; }

            /* Theme stats: stack name above bar so a long theme name doesn't
               force horizontal scroll. */
            .theme-stats-row .name { min-width: 0; display: block; margin-bottom: 2px; }
            .theme-stats-row .bar { width: 100%; max-width: 100%; display: block; margin: 0 0 2px 0; }
            .theme-stats-row .pct { display: block; }

            /* Meta game-link: stop right-floating, sit on its own line. */
            .meta-event .game-link { float: none; display: block; margin-top: 4px; }

            /* Long handles / names in roster: prevent breakout. */
            .meta-roster .player { word-break: break-word; }
        }
    </style>
</head>
<body class="min-h-full relative" style="background:#fff;">
<div>
    <!-- HEADER -- copied verbatim from NACCL main, only:
         - logo width shrunk (w-32 sm:w-36 instead of w-52 sm:w-56)
         - nav links replaced with puzzle-specific ones
         All other classes (px-6 / mx-auto / gap-x-10 / hover:border-custom-blue
         etc.) are exactly as NACCL uses them so the compiled output.css picks
         them up. -->
    <header x-data="{ openTeams: false, openStandings: false, openTeamsMobile: false, openStandingsMobile: false, openMobile: false, }" class="px-6" style="background:#fff;">
        <nav class="mx-auto flex lg:flex-col xl:flex-row gap-y-4 container items-center justify-between gap-x-10 p-6 px-0 xl:px-3 2xl:px-8 sm:mt-3 lg:mt-4" aria-label="Global">
            <a href="." class="-m-1.5 p-1.5 flex-none">
                <span class="sr-only">NACCL Puzzle</span>
                <img class="w-52 sm:w-56 xl:w-52 2xl:w-56" src="images/logo.png" alt="North American Corporate Chess League">
            </a>
            <div class="flex lg:hidden">
                <a type="button" @click="openMobile = true" class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700">
                    <span class="sr-only">Open main menu</span>
                    <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"></path>
                    </svg>
                </a>
            </div>
            <div class="hidden lg:flex lg:gap-x-6 2xl:gap-x-10 gap-y-3 items-center uppercase flex-wrap">
                <a href="." class="text-sm/6 font-medium text-gray-900 border-b-2 border-transparent hover:border-custom-blue transition selected">Puzzle</a>
                <a href="Leaderboard" class="text-sm/6 font-medium text-gray-900 border-b-2 border-transparent hover:border-custom-blue transition ">Puzzle Leaderboard</a>

                

                <a href="https://nacorporatechess.com" class="text-sm/6 font-medium text-gray-900 border-b-2 border-transparent hover:border-custom-blue transition">NACCL Home</a>

                
                    <a href="Login" class="text-sm/6 font-medium text-gray-900 border-b-2 border-transparent hover:border-custom-blue transition">Login with Chess.com</a>
                
            </div>
        </nav>

        <!-- Mobile menu -->
        <div x-show="openMobile" class="lg:hidden" role="dialog" aria-modal="true" style="display: none;">
            <div class="fixed inset-0 z-10"></div>
            <div class="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
                <div class="flex items-center justify-between">
                    <a href="." class="-m-1.5 p-1.5">
                        <span class="sr-only">NACCL Puzzle</span>
                        <img class="h-8 w-auto" src="images/logo.png" alt="NACCL">
                    </a>
                    <button @click="openMobile = false" type="button" class="-m-2.5 rounded-md p-2.5 text-gray-700">
                        <span class="sr-only">Close menu</span>
                        <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="mt-6 -my-6 divide-y divide-gray-500/10">
                    <div class="space-y-2 py-6">
                        <a href="." class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-medium text-gray-900 hover:bg-gray-50 uppercase">Puzzle</a>
                        <a href="Leaderboard" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-medium text-gray-900 hover:bg-gray-50 uppercase">Puzzle Leaderboard</a>
                        
                        <a href="https://nacorporatechess.com" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-medium text-gray-900 hover:bg-gray-50 uppercase">NACCL Home</a>
                        
                            <a href="Login" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-medium text-gray-900 hover:bg-gray-50 uppercase">Login with Chess.com</a>
                        
                    </div>
                </div>
            </div>
        </div>
    </header>

    <form method="post" action="./" id="form1">
<div class="aspNetHidden">
<input type="hidden" name="__VIEWSTATE" id="__VIEWSTATE" value="Qa5l6rL1fG0AWv+cw7ZN2PodptqnkMkRvbDBCzenj1UJ1fjRu2w5+AfBfnmWRgmOZu4QhXQ119ySzOGAPg4l8k805OCmdvqO5EntXTnx7qY=">
</div>

<div class="aspNetHidden">

	<input type="hidden" name="__VIEWSTATEGENERATOR" id="__VIEWSTATEGENERATOR" value="A01026FC">
</div>
        <div class="relative lg:mt-3">
            <div class="custom-gray-bg-2">
                
                    <div class="container mx-auto pt-8 px-3">
                        <div class="max-w-xl mx-auto bg-custom-red rounded-full text-white text-center text-sm py-2 px-5">
                            <b>Practice mode</b> — <a href="Login" class="underline font-semibold">log in with Chess.com</a> to save your rating
                        </div>
                    </div>
                

<div class="container mx-auto pt-4 sm:pt-8 lg:pt-10 px-3">
    <h1 class="text-3xl sm:text-5xl md:text-6xl font-bold tracking-wide text-center">
        <span class="text-custom-red text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-wide">NACCL</span>
        Puzzle
    </h1>
    <p class="text-sm sm:text-base text-gray-600 text-center mt-2 max-w-xl mx-auto">
        Tactical puzzles drawn from real NACCL games. Solve, rate, climb the leaderboard.
    </p>
</div>

<div class="container mx-auto px-3 mt-6 sm:mt-8">
<div class="bg-white rounded-[40px] shadow-sm pt-10 sm:pt-14 pb-16 px-4 sm:px-8 lg:px-12">
<main class="puzzle-main">
    <section>
        <div class="tab-nav">
            <button id="tabPuzzle" class="active" type="button">Puzzle</button>
            <button id="tabHistory" type="button" class="">History</button>
            <button id="tabStats" type="button" class="">Theme stats</button>
        </div>
        <div id="paneBoard" style="">
            <div id="boardWithBar">
                <div id="evalBar" style="display: none;"><div id="evalBarFill" style="height: 88.45%;"></div><span id="evalBarText">+7.7</span></div>
                <div id="boardWrap">
                    <div id="board"><div class="chessboard-63f37"><div class="board-b72b1" style="width: 472px;"><div class="row-5277c"><div class="square-55d63 white-1e1d7 square-a8" style="width:59px;height:59px;" id="a8-99cd-5e33-2665-9b4a-0875-3ceb-c3ec-0713" data-square="a8"><div class="notation-322f9 numeric-fc462">8</div></div><div class="square-55d63 black-3c85d square-b8" style="width:59px;height:59px;" id="b8-892f-fe52-a4d9-1964-5da9-e33e-c758-d21a" data-square="b8"></div><div class="square-55d63 white-1e1d7 square-c8" style="width:59px;height:59px;" id="c8-f94a-4637-b64d-d3c4-a047-83c9-781c-19fb" data-square="c8"></div><div class="square-55d63 black-3c85d square-d8" style="width:59px;height:59px;" id="d8-634a-8edd-bed8-acc3-a51a-7de3-f6a8-1bda" data-square="d8"></div><div class="square-55d63 white-1e1d7 square-e8" style="width:59px;height:59px;" id="e8-8534-735a-eab5-4091-71d5-9c76-8d2e-ad6d" data-square="e8"><img src="/puzzle/assets/images/chesspieces/bR.png" alt="" class="piece-417db" data-piece="bR" style="width:59px;height:59px;"></div><div class="square-55d63 black-3c85d square-f8" style="width:59px;height:59px;" id="f8-f11e-1ac7-319c-f6e4-1216-a229-e72b-7bc7" data-square="f8"><img src="/puzzle/assets/images/chesspieces/bR.png" alt="" class="piece-417db" data-piece="bR" style="width:59px;height:59px;"></div><div class="square-55d63 white-1e1d7 square-g8" style="width:59px;height:59px;" id="g8-f290-2d00-cf81-6934-cbaf-7676-820e-4c06" data-square="g8"><img src="/puzzle/assets/images/chesspieces/bK.png" alt="" class="piece-417db" data-piece="bK" style="width:59px;height:59px;"></div><div class="square-55d63 black-3c85d square-h8" style="width:59px;height:59px;" id="h8-7eb8-b8ac-5dcf-0527-d4db-f44b-d1e7-62f6" data-square="h8"></div><div class="clearfix-7da63"></div></div><div class="row-5277c"><div class="square-55d63 black-3c85d square-a7" style="width:59px;height:59px;" id="a7-d3a4-279a-9ad1-31df-9b04-a09d-8d7c-bf82" data-square="a7"><div class="notation-322f9 numeric-fc462">7</div><img src="/puzzle/assets/images/chesspieces/bP.png" alt="" class="piece-417db" data-piece="bP" style="width:59px;height:59px;"></div><div class="square-55d63 white-1e1d7 square-b7" style="width:59px;height:59px;" id="b7-a2e9-c105-ef02-fcde-5477-b18b-99e2-e021" data-square="b7"><img src="/puzzle/assets/images/chesspieces/bP.png" alt="" class="piece-417db" data-piece="bP" style="width:59px;height:59px;"></div><div class="square-55d63 black-3c85d square-c7" style="width:59px;height:59px;" id="c7-6484-0f3f-ede7-cacb-a5f4-f7fa-1690-0349" data-square="c7"></div><div class="square-55d63 white-1e1d7 square-d7" style="width:59px;height:59px;" id="d7-0a16-72b2-6b3b-ecc5-9d56-6cd4-4d78-cccf" data-square="d7"></div><div class="square-55d63 black-3c85d square-e7" style="width:59px;height:59px;" id="e7-1a95-ad0b-8627-57d9-9d80-21de-8c35-e91a" data-square="e7"></div><div class="square-55d63 white-1e1d7 square-f7" style="width:59px;height:59px;" id="f7-ce70-8798-83a9-e01e-0884-1845-58f7-fead" data-square="f7"><img src="/puzzle/assets/images/chesspieces/bP.png" alt="" class="piece-417db" data-piece="bP" style="width:59px;height:59px;"></div><div class="square-55d63 black-3c85d square-g7" style="width:59px;height:59px;" id="g7-ba82-b768-a37b-e158-b1f6-92d7-0038-a724" data-square="g7"></div><div class="square-55d63 white-1e1d7 square-h7" style="width:59px;height:59px;" id="h7-541e-68b8-f202-d09f-88d7-ee6b-045d-b51a" data-square="h7"></div><div class="clearfix-7da63"></div></div><div class="row-5277c"><div class="square-55d63 white-1e1d7 square-a6" style="width:59px;height:59px;" id="a6-3cac-4a3e-4a84-272e-7bdf-1607-881d-9c0b" data-square="a6"><div class="notation-322f9 numeric-fc462">6</div></div><div class="square-55d63 black-3c85d square-b6" style="width:59px;height:59px;" id="b6-2364-8bfa-49a0-0349-33ef-fdd9-d57d-bab5" data-square="b6"></div><div class="square-55d63 white-1e1d7 square-c6" style="width:59px;height:59px;" id="c6-9d30-c5d0-1833-366d-2143-08fa-fc60-ff72" data-square="c6"></div><div class="square-55d63 black-3c85d square-d6" style="width:59px;height:59px;" id="d6-3c10-b106-2537-3cb9-e6c0-5975-c9b8-4a3d" data-square="d6"></div><div class="square-55d63 white-1e1d7 square-e6" style="width:59px;height:59px;" id="e6-493c-7bd2-e071-9ae9-a048-b9aa-c3cf-aa7a" data-square="e6"></div><div class="square-55d63 black-3c85d square-f6" style="width:59px;height:59px;" id="f6-8b16-3a8a-c6b4-57d1-a867-e6d7-5828-942b" data-square="f6"></div><div class="square-55d63 white-1e1d7 square-g6" style="width:59px;height:59px;" id="g6-3aa8-4686-17da-4ded-64a0-96df-1664-d74d" data-square="g6"></div><div class="square-55d63 black-3c85d square-h6" style="width:59px;height:59px;" id="h6-c781-59c0-e317-c5be-f660-7e03-b37b-5c4b" data-square="h6"><img src="/puzzle/assets/images/chesspieces/bP.png" alt="" class="piece-417db" data-piece="bP" style="width:59px;height:59px;"></div><div class="clearfix-7da63"></div></div><div class="row-5277c"><div class="square-55d63 black-3c85d square-a5" style="width:59px;height:59px;" id="a5-2f3d-6d63-16d2-23c3-7bcd-c1a1-4386-9c99" data-square="a5"><div class="notation-322f9 numeric-fc462">5</div></div><div class="square-55d63 white-1e1d7 square-b5" style="width:59px;height:59px;" id="b5-e447-3d96-51c5-39b1-74b3-34b2-c485-611f" data-square="b5"></div><div class="square-55d63 black-3c85d square-c5" style="width:59px;height:59px;" id="c5-3e78-a038-1d99-642a-8482-198a-8245-2833" data-square="c5"><img src="/puzzle/assets/images/chesspieces/bP.png" alt="" class="piece-417db" data-piece="bP" style="width:59px;height:59px;"></div><div class="square-55d63 white-1e1d7 square-d5" style="width:59px;height:59px;" id="d5-8e0c-3ca2-f96b-cee8-6c42-33e9-efb5-ab6e" data-square="d5"><img src="/puzzle/assets/images/chesspieces/bP.png" alt="" class="piece-417db" data-piece="bP" style="width:59px;height:59px;"></div><div class="square-55d63 black-3c85d square-e5" style="width:59px;height:59px;" id="e5-e58a-c9b3-a2af-5b63-77ae-12fe-4f70-3f28" data-square="e5"><img src="/puzzle/assets/images/chesspieces/bB.png" alt="" class="piece-417db" data-piece="bB" style="width:59px;height:59px;"></div><div class="square-55d63 white-1e1d7 square-f5" style="width:59px;height:59px;" id="f5-8cd2-a6d8-48ea-64c7-983b-74ec-6a99-4f95" data-square="f5"></div><div class="square-55d63 black-3c85d square-g5" style="width:59px;height:59px;" id="g5-1090-630a-a461-466b-9bda-6369-07a1-47fb" data-square="g5"><img src="/puzzle/assets/images/chesspieces/bQ.png" alt="" class="piece-417db" data-piece="bQ" style="width:59px;height:59px;"></div><div class="square-55d63 white-1e1d7 square-h5" style="width:59px;height:59px;" id="h5-fe1b-415e-3156-f6fb-e501-4958-cd21-0696" data-square="h5"><img src="/puzzle/assets/images/chesspieces/wB.png" alt="" class="piece-417db" data-piece="wB" style="width:59px;height:59px;"></div><div class="clearfix-7da63"></div></div><div class="row-5277c"><div class="square-55d63 white-1e1d7 square-a4" style="width:59px;height:59px;" id="a4-3670-088d-49fa-aeb3-df3b-c6cd-f552-d544" data-square="a4"><div class="notation-322f9 numeric-fc462">4</div></div><div class="square-55d63 black-3c85d square-b4" style="width:59px;height:59px;" id="b4-811e-5724-1921-35f3-5141-2ce6-59f8-1d0d" data-square="b4"></div><div class="square-55d63 white-1e1d7 square-c4" style="width:59px;height:59px;" id="c4-e6b1-3dca-8cb5-8444-bc89-9a69-3d02-2498" data-square="c4"></div><div class="square-55d63 black-3c85d square-d4" style="width:59px;height:59px;" id="d4-dda4-2447-af77-de6e-29c3-021a-23b6-e694" data-square="d4"></div><div class="square-55d63 white-1e1d7 square-e4 highlight-last-move" style="width:59px;height:59px;" id="e4-0707-d5a6-8065-2d7b-98e4-e1b2-0965-fd8a" data-square="e4"></div><div class="square-55d63 black-3c85d square-f4" style="width:59px;height:59px;" id="f4-a1df-af28-693c-7a08-2081-0ced-900d-68ac" data-square="f4"></div><div class="square-55d63 white-1e1d7 square-g4 highlight-last-move" style="width:59px;height:59px;" id="g4-0062-2f6e-cc57-2eb6-83dc-ff95-8f6d-0309" data-square="g4"><img src="/puzzle/assets/images/chesspieces/wR.png" alt="" class="piece-417db" data-piece="wR" style="width:59px;height:59px;"></div><div class="square-55d63 black-3c85d square-h4" style="width:59px;height:59px;" id="h4-2dbb-51f3-4fca-6dce-dbb7-5be3-2bd8-44c4" data-square="h4"></div><div class="clearfix-7da63"></div></div><div class="row-5277c"><div class="square-55d63 black-3c85d square-a3" style="width:59px;height:59px;" id="a3-8dd1-8f2f-4a4b-bd1c-b5f5-9b8f-9c9c-7dbd" data-square="a3"><div class="notation-322f9 numeric-fc462">3</div></div><div class="square-55d63 white-1e1d7 square-b3" style="width:59px;height:59px;" id="b3-70b2-af2e-0bc3-1c41-55b4-ab6f-ff86-79a0" data-square="b3"></div><div class="square-55d63 black-3c85d square-c3" style="width:59px;height:59px;" id="c3-42e8-a83e-be99-4e03-a76b-1247-d971-5cf4" data-square="c3"></div><div class="square-55d63 white-1e1d7 square-d3" style="width:59px;height:59px;" id="d3-2c78-b6af-5ba6-d5be-7f8a-7d25-b425-98ed" data-square="d3"></div><div class="square-55d63 black-3c85d square-e3" style="width:59px;height:59px;" id="e3-e47b-34d4-5a10-fa16-4931-c13f-86ee-0a49" data-square="e3"></div><div class="square-55d63 white-1e1d7 square-f3" style="width:59px;height:59px;" id="f3-d46e-31cb-1ac0-e482-4b7d-8102-a09d-4640" data-square="f3"><img src="/puzzle/assets/images/chesspieces/wQ.png" alt="" class="piece-417db" data-piece="wQ" style="width:59px;height:59px;"></div><div class="square-55d63 black-3c85d square-g3" style="width:59px;height:59px;" id="g3-8628-5d7d-1b6d-4ccf-58c7-540d-f591-7df2" data-square="g3"></div><div class="square-55d63 white-1e1d7 square-h3" style="width:59px;height:59px;" id="h3-2e21-2dd6-a98b-82e1-074a-3a93-d90b-cb80" data-square="h3"><img src="/puzzle/assets/images/chesspieces/wP.png" alt="" class="piece-417db" data-piece="wP" style="width:59px;height:59px;"></div><div class="clearfix-7da63"></div></div><div class="row-5277c"><div class="square-55d63 white-1e1d7 square-a2" style="width:59px;height:59px;" id="a2-148a-1d91-5306-44b5-295d-9458-dbcb-3248" data-square="a2"><div class="notation-322f9 numeric-fc462">2</div><img src="/puzzle/assets/images/chesspieces/wP.png" alt="" class="piece-417db" data-piece="wP" style="width:59px;height:59px;"></div><div class="square-55d63 black-3c85d square-b2" style="width:59px;height:59px;" id="b2-f9c0-4d01-32b4-3e88-a03d-8b50-68e3-2a34" data-square="b2"><img src="/puzzle/assets/images/chesspieces/wP.png" alt="" class="piece-417db" data-piece="wP" style="width:59px;height:59px;"></div><div class="square-55d63 white-1e1d7 square-c2" style="width:59px;height:59px;" id="c2-2fbf-c5ce-4161-f332-b64b-66ad-746c-bfd2" data-square="c2"><img src="/puzzle/assets/images/chesspieces/wP.png" alt="" class="piece-417db" data-piece="wP" style="width:59px;height:59px;"></div><div class="square-55d63 black-3c85d square-d2" style="width:59px;height:59px;" id="d2-62a9-90d9-e5c1-b7fe-249f-a79d-30aa-b1c3" data-square="d2"></div><div class="square-55d63 white-1e1d7 square-e2" style="width:59px;height:59px;" id="e2-799e-dfb5-93e7-97c0-a157-1c89-5391-68ea" data-square="e2"></div><div class="square-55d63 black-3c85d square-f2" style="width:59px;height:59px;" id="f2-f883-f37a-4292-bdde-e630-a454-50d0-3564" data-square="f2"><img src="/puzzle/assets/images/chesspieces/wP.png" alt="" class="piece-417db" data-piece="wP" style="width:59px;height:59px;"></div><div class="square-55d63 white-1e1d7 square-g2" style="width:59px;height:59px;" id="g2-598e-d5b3-2e7f-1b28-0dab-ee8f-8335-cc50" data-square="g2"><img src="/puzzle/assets/images/chesspieces/wP.png" alt="" class="piece-417db" data-piece="wP" style="width:59px;height:59px;"></div><div class="square-55d63 black-3c85d square-h2" style="width:59px;height:59px;" id="h2-f5d0-2e75-3642-92c6-c56c-8e42-49ea-ac7a" data-square="h2"></div><div class="clearfix-7da63"></div></div><div class="row-5277c"><div class="square-55d63 black-3c85d square-a1" style="width:59px;height:59px;" id="a1-f584-fd77-378d-faf9-624f-117e-6928-b61e" data-square="a1"><div class="notation-322f9 alpha-d2270">a</div><div class="notation-322f9 numeric-fc462">1</div></div><div class="square-55d63 white-1e1d7 square-b1" style="width:59px;height:59px;" id="b1-877b-227e-5d6c-798a-5214-8cb3-2ead-9c9d" data-square="b1"><div class="notation-322f9 alpha-d2270">b</div></div><div class="square-55d63 black-3c85d square-c1" style="width:59px;height:59px;" id="c1-7e2a-d711-fb73-37a7-397c-43b2-9ddc-d315" data-square="c1"><div class="notation-322f9 alpha-d2270">c</div></div><div class="square-55d63 white-1e1d7 square-d1" style="width:59px;height:59px;" id="d1-71ee-9d97-f6e0-1cb4-a9c4-105e-ffe0-d7cf" data-square="d1"><div class="notation-322f9 alpha-d2270">d</div></div><div class="square-55d63 black-3c85d square-e1" style="width:59px;height:59px;" id="e1-38f3-6424-da34-1219-ee8d-2617-cf2a-f0fb" data-square="e1"><div class="notation-322f9 alpha-d2270">e</div></div><div class="square-55d63 white-1e1d7 square-f1" style="width:59px;height:59px;" id="f1-ee79-29f6-8f15-27b9-5205-c1b2-2b26-a021" data-square="f1"><div class="notation-322f9 alpha-d2270">f</div><img src="/puzzle/assets/images/chesspieces/wR.png" alt="" class="piece-417db" data-piece="wR" style="width:59px;height:59px;"></div><div class="square-55d63 black-3c85d square-g1" style="width:59px;height:59px;" id="g1-fb50-b883-5524-d6e3-b6ea-fd72-29db-5896" data-square="g1"><div class="notation-322f9 alpha-d2270">g</div><img src="/puzzle/assets/images/chesspieces/wK.png" alt="" class="piece-417db" data-piece="wK" style="width:59px;height:59px;"></div><div class="square-55d63 white-1e1d7 square-h1" style="width:59px;height:59px;" id="h1-5846-e304-1fcf-30b8-d97f-f22a-efbc-4a3f" data-square="h1"><div class="notation-322f9 alpha-d2270">h</div></div><div class="clearfix-7da63"></div></div></div></div></div>
                    <svg id="boardArrows" viewBox="0 0 480 480"></svg>
                </div>
            </div>
            <div class="panel" style="margin-top:14px;">
                <div class="controls-row">
                    <label for="ddlLevel">Level:</label>
                <select id="ddlLevel">
                    <option value="0">Any</option>
                    <option value="1">1 — Very Easy</option>
                    <option value="2">2 — Easy</option>
                    <option value="3">3 — Normal</option>
                    <option value="4">4 — Hard</option>
                    <option value="5">5 — Very Hard</option>
                </select>
                <label for="ddlTheme" style="margin-left:8px;">Theme:</label>
                <select id="ddlTheme" style="max-width:180px;">
                    <option value="">Any theme</option>
                    <optgroup label="Tactical Motifs">
                        <option value="fork">Fork</option>
                        <option value="pin">Pin</option>
                        <option value="skewer">Skewer</option>
                        <option value="discovered-attack">Discovered Attack</option>
                        <option value="x-ray">X-Ray</option>
                        <option value="deflection">Deflection</option>
                        <option value="attraction">Attraction (Decoy)</option>
                        <option value="remove-defender">Remove Defender</option>
                        <option value="trapped-piece">Trapped Piece</option>
                    </optgroup>
                    <optgroup label="Mate Patterns">
                        <option value="mate">Any Mate</option>
                        <option value="mate-in-1">Mate-in-1</option>
                        <option value="mate-in-2">Mate-in-2</option>
                        <option value="mate-in-3">Mate-in-3</option>
                        <option value="mate-in-4">Mate-in-4+</option>
                        <option value="back-rank-mate">Back Rank Mate</option>
                        <option value="smothered-mate">Smothered Mate</option>
                        <option value="arabian-mate">Arabian Mate</option>
                        <option value="anastasia-mate">Anastasia Mate</option>
                        <option value="boden-mate">Boden Mate</option>
                        <option value="dovetail-mate">Dovetail Mate</option>
                        <option value="hook-mate">Hook Mate</option>
                    </optgroup>
                    <optgroup label="Characteristics">
                        <option value="quiet">Quiet (Brilliant)</option>
                        <option value="sacrifice">Sacrifice</option>
                        <option value="endgame">Endgame</option>
                        <option value="advanced-pawn">Advanced Pawn</option>
                        <option value="check">Check</option>
                        <option value="capture">Capture</option>
                        <option value="promotion">Promotion</option>
                    </optgroup>
                </select>
            </div>
        </div>
        </div>
        <div id="paneHistory" style="display: none;">
            <div class="panel">
                <h3>History</h3>
                <div class="controls-row" style="margin-bottom:8px;">
                    <button id="btnHistFailed" class="secondary" type="button">Failed</button>
                    <button id="btnHistSolved" class="secondary" type="button">Solved</button>
                    <button id="btnHistAll" class="secondary" type="button">All</button>
                </div>
                <div id="historyList" class="history-list"><div style="color:#888;padding:10px;">Log in to see your puzzle history.</div></div>
            </div>
        </div>
        <div id="paneStats" style="display: none;">
            <div class="panel">
                <h3>Theme weakness chart</h3>
                <p style="font-size:12px;color:#666;margin:0 0 10px;">Sorted from weakest (lowest solve rate) to strongest, based on themes you've attempted at least 3 times.</p>
                <div id="statsList"><div style="color:#888;">Log in to see your theme stats.</div></div>
            </div>
        </div>
    </section>

    <section>
        <div class="panel">
            <h3>Puzzle</h3>
            <div id="puzzleMeta" class="meta">
                
                        <div class="meta-event">
                            <b>NACCL Season 7</b>
                            
                                · Round 2
                            
                                <a class="game-link" target="_blank" rel="noopener" href="https://lichess.org/8S9C6X8M" title="View game on lichess">view game ↗</a>
                            
                        </div>
                    
                    <div class="meta-roster">
                        <div class="player white">
                            <span class="dot" aria-hidden="true">♙</span>
                            <span class="name">DANIEL GITELMAN</span>
                            <span class="team">SUSQUEHANNA</span>
                        </div>
                        <div class="player black">
                            <span class="dot" aria-hidden="true">♟</span>
                            <span class="name">STEVEN VAUGHAN</span>
                            <span class="team">EY</span>
                        </div>
                    </div>
                    <div style="margin-top:8px;"><span class="pill level">Level 4</span></div>
                
            </div>
        </div>
        <div class="panel">
            <h3>How to play</h3>
            <p style="margin:0; font-size:13px; line-height:1.5; color:#555;">
                Find the best move for the side to move.
            </p>
        </div>
        <div class="panel">
            <h3>Tools</h3>
            <div class="controls-row">
                <button id="btnNewPuzzle" class="primary" type="button">Next puzzle</button>
                <button id="btnTryAgain" class="primary" type="button" style="background: rgb(162, 58, 58);">Try again</button>
                <button id="btnHint" class="secondary" type="button">Hint</button>
                <button id="btnShowSolution" class="secondary" type="button">Show solution</button>
                <button id="btnAnalyze" class="secondary" type="button">Analyze</button>
                <button id="btnShare" class="secondary" type="button" title="Copy link to this puzzle">Share</button>
                <button id="btnTakeBack" class="secondary" type="button" style="display: none;">Take back</button>
                <button id="btnResetToStart" class="secondary" type="button" style="display: none;">Reset to start</button>
            </div>
            <label style="display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:13px;color:#555;cursor:pointer;user-select:none;">
                <input type="checkbox" id="chkAutoAdvance">
                <span>Automatically load the next puzzle after each attempt</span>
            </label>
            <div id="streakBox" style="margin-top: 10px; display: block;">Today: <b>0</b> solved</div>
        </div>
        <div id="status" class="status bad" style="">Gave up — engine view. — Practice (log in to rate)</div>
        <div id="analysisPanel" class="panel" style="display: none;">
            <h3>Engine analysis <span id="analysisFen" style="font-weight:normal;color:#888;font-size:11px;font-family:monospace;">4rrk1/pp3p2/7p/2ppb1qB/6R1/5Q1P/PPP2PP1/5RK1 b</span></h3>
            <div id="analysisLines" style="font-size:13px;"><div style="padding:6px 0;border-bottom:1px solid #f0f0f0;"><b style="color:#cf222e;min-width:60px;display:inline-block;">-7.69</b> <span style="color:#333;">b6 Rxg5+ hxg5 Qxd5 Bxb2 Qxg5+ Bg7 Bf3</span></div><div style="padding:6px 0;border-bottom:1px solid #f0f0f0;"><b style="color:#cf222e;min-width:60px;display:inline-block;">-8.46</b> <span style="color:#333;">Qg7 Qxd5 Bxb2 Qxb7 Bd4 Rxg7+ Kxg7 Bf3</span></div><div style="padding:6px 0;border-bottom:1px solid #f0f0f0;"><b style="color:#cf222e;min-width:60px;display:inline-block;">-8.46</b> <span style="color:#333;">Re7 Rxg5+ hxg5 Qxd5 b6 Re1 Bh2+ Kf1</span></div><div style="margin-top:8px;font-size:12px;color:#5d82a8;">Move pieces for both sides freely — the analysis updates after each move so you can explore any continuation you want, including replies you fear from the opponent.</div></div>
            <div style="margin-top:8px;font-size:11px;color:#888;">Powered by Stockfish.js running in your browser (no server required).</div>
        </div>
    </section>
</main>
</div>
</div>

<!-- Outcome modal -- shows after each puzzle submission with a big visible Correct/Wrong result. -->
<div id="outcomeModal" class="outcome-modal" style="display:none;" aria-hidden="true" role="dialog">
    <div class="outcome-modal-backdrop"></div>
    <div class="outcome-modal-card">
        <div id="outcomeModalIcon" class="outcome-modal-icon" aria-hidden="true"></div>
        <h2 id="outcomeModalTitle" class="outcome-modal-title"></h2>
        <p id="outcomeModalMeta" class="outcome-modal-meta"></p>
        <div class="outcome-modal-actions">
            <button id="outcomeModalNext" class="primary" type="button">Next puzzle</button>
            <button id="outcomeModalClose" class="secondary" type="button">Close</button>
        </div>
    </div>
</div>

<script>
    var INITIAL_PUZZLE = {"id":17148,"gameId":"NACCLSeason7Rd123#212","fen":"4rrk1/pp3p2/7p/2ppb1qB/4R3/5Q1P/PPP2PP1/5RK1 w - - 0 20","level":4,"solutionUci":"e4g4 e8e7","solutionSan":"Rg4 Re7","themes":"[\"quiet\", \"pin\", \"discovered-attack\", \"x-ray\"]","eventName":"NACCL Season 7","roundNumber":2,"tableNumber":"231","sectionName":"MAIN","platform":"lichess","gameURL":"https://lichess.org/8S9C6X8M","whiteName":"DANIEL GITELMAN","whiteHandle":"FutbolPulse","whiteTeam":"SUSQUEHANNA","whiteRating":0,"blackName":"STEVEN VAUGHAN","blackHandle":"SV_EY","blackTeam":"EY","blackRating":913};
    var ATTEMPT_URL = '/puzzle/PuzzleAttempt.ashx';
    var RANDOM_URL  = '/puzzle/PuzzleRandom.ashx';

    var currentPuzzle = INITIAL_PUZZLE;
    var board = null;
    var game = null;
    // Multi-move puzzle state.
    //   solutionList:   array of UCI strings, even indices are solver moves,
    //                   odd indices are forced opponent replies.
    //   solverIdx:      index into solutionList of the solver move the user
    //                   is currently expected to play. Starts at 0, advances
    //                   by 2 after each correct move + auto-played reply.
    //   puzzleEnded:    true once user finishes the line correctly OR fails;
    //                   blocks further drag attempts.
    //   ratedReceived:  true once we've POSTed firstMove to /PuzzleAttempt.ashx;
    //                   subsequent moves are validated client-side only because
    //                   the backend rates the puzzle as a whole based on first
    //                   move (matches the chess-article prototype contract).
    var solutionList = [];
    var solverIdx = 0;
    var puzzleEnded = false;
    var ratedReceived = false;
    var attemptSuffix = "";
    // Free-play analysis mode: after a puzzle is finished (correct or
    // wrong), user can hit "Continue analyzing" to keep playing on the
    // board against the engine. In this mode the solution checker is
    // bypassed entirely; every user move is auto-followed by Stockfish's
    // best reply, and the engine analysis panel refreshes after each move.
    var analysisMode = false;
    var engineThinking = false;  // re-entrancy guard
    // First move cached locally so we can submit it at puzzle END instead
    // of after move 1. This way wrong continuation in a multi-move puzzle
    // makes the rating drop instead of go up (the previous Lichess-style
    // "rate on first move" was confusing for users).
    var firstMoveCache = "";
    // Explore mode: enabled after Show solution finishes playing out.
    // The board accepts drags freely (chess.js validates legality) so the
    // user can poke around the resulting position without firing engine
    // queries. Distinct from analysisMode (which auto-queries Stockfish
    // after every move). Reset whenever a fresh puzzle loads.
    var exploreMode = false;
    // Move history stack for analysis-mode take-back. Each entry is the
    // FEN snapshot BEFORE the move was made. Push on every move, pop on
    // Take back. Reset whenever a new puzzle loads or analysis starts.
    var moveHistory = [];
    // Checkpoint state: snapshot of the board the moment it was the user's
    // turn (start of puzzle, or right after the engine auto-played a forced
    // reply). Try again restores to here — so on a multi-move puzzle the
    // user only retries from the move they got wrong, not from the very
    // beginning.
    var checkpointFen = null;
    var checkpointSolverIdx = 0;
    // Streak tracking via localStorage. solvedToday, failedToday refresh
    // at midnight client-side. currentStreak = consecutive correct
    // answers on FIRST attempt (resets to 0 on any failure).
    var STREAK_KEY = "naccl_puzzle_streak_v1";

    function initBoard(puzzle) {
        if (!puzzle || !puzzle.fen) {
            $("#board").html("<div style='padding:20px;color:#888;'>No puzzle to display.</div>");
            return;
        }
        solutionList = (puzzle.solutionUci || "").trim().split(/\s+/).filter(function (s) { return s.length > 0; });
        solverIdx = 0;
        puzzleEnded = false;
        ratedReceived = false;
        attemptSuffix = "";
        // Initial checkpoint: the puzzle's starting position. Updated each
        // time the engine finishes auto-playing an opp reply.
        checkpointFen = puzzle.fen;
        checkpointSolverIdx = 0;
        // Hide Try again button + analysis panel when starting a fresh puzzle.
        $("#btnTryAgain").hide();
        $("#analysisPanel").hide();
        $("#btnTakeBack").hide();
        $("#btnResetToStart").hide();
        $("#evalBar").hide();
        // Reset analysis mode if user was analysing the previous puzzle.
        analysisMode = false;
        exploreMode = false;
        engineThinking = false;
        moveHistory = [];
        $("#btnAnalyze").text("Analyze");
        // Clear highlights + arrows from any previous puzzle.
        highlightLastMove(null);
        clearBestMoveArrow();
        clearHint();
        game = new Chess(puzzle.fen);
        var orientation = (puzzle.fen.split(" ")[1] === "w") ? "white" : "black";
        if (board) { board.destroy(); }
        board = Chessboard("board", {
            position: puzzle.fen,
            orientation: orientation,
            draggable: true,
            pieceTheme: '/puzzle/assets/images/chesspieces/{piece}.png',
            onDragStart: function (source, piece) {
                // Allow drag on ANY piece (own or opponent's). If the user
                // picks up a wrong-colour piece, game.move() will reject in
                // onDrop and the piece snaps back. Letting the wrong-colour
                // drag start avoids leaking "this is the side to move"
                // information to the user (which would be a puzzle cheat).
            },
            onDrop: function (source, target) {
                // chessboardjs fires onDrop for both real drags AND for taps
                // that never moved (touchstart -> touchend on same square).
                // When source === target, treat it as a click-to-move
                // selection rather than a move attempt.
                if (source === target) {
                    if (clickedSquare === source) {
                        // Tapping the selected square again = deselect.
                        clearClickSelection();
                    } else {
                        clearClickSelection();
                        clickedSquare = source;
                        jQuery("#board .square-" + source).addClass("highlight-selected");
                    }
                    return;
                }
                // Real drag-and-drop move.
                clearClickSelection();
                return attemptMove(source, target, /*viaDrag*/true);
            },
            onSnapEnd: function () { board.position(game.fen()); }
        });

        // Wire up click-to-move as an accessible alternative to drag (esp.
        // on phones where dragging is fiddly). Tap source square -> tap
        // target square. Tapping the same square again deselects; tapping
        // a different own-piece switches the selection.
        clearClickSelection();
        jQuery("#board").off("click.tapMove").on("click.tapMove", ".square-55d63", onSquareClick);
    }

    // ---- click-to-move ------------------------------------------------
    var clickedSquare = null;

    function clearClickSelection() {
        clickedSquare = null;
        jQuery("#board .highlight-selected").removeClass("highlight-selected");
    }

    function onSquareClick(e) {
        if (!board || !game) return;

        // Extract the square name (e2, f6, ...) from chessboardjs's
        // ".square-e2" class. Each square node also has ".square-55d63".
        var classes = jQuery(this).attr("class") || "";
        var m = classes.match(/square-([a-h][1-8])/);
        if (!m) return;
        var square = m[1];

        var position = board.position();
        var pieceOnSquare = position[square];                // 'wK' / 'bP' / undefined
        // We intentionally do NOT check whose turn it is here. Highlighting
        // only on own-colour pieces would tell the user which side has the
        // move (a puzzle cheat). Wrong-colour selection just fails silently
        // when the user tries to move it.

        if (clickedSquare === null) {
            // First tap: select a piece (any colour). Empty square is a no-op.
            if (!pieceOnSquare) return;
            clickedSquare = square;
            jQuery(this).addClass("highlight-selected");
            return;
        }

        if (clickedSquare === square) {
            // Tap same square = deselect.
            clearClickSelection();
            return;
        }

        if (pieceOnSquare) {
            // Tap on a different piece: switch selection to it.
            clearClickSelection();
            clickedSquare = square;
            jQuery(this).addClass("highlight-selected");
            return;
        }

        // Tap on empty square: attempt to move from the selected square here.
        var from = clickedSquare;
        clearClickSelection();
        var ok = attemptMove(from, square, /*viaDrag*/false);
        if (ok !== "snapback") {
            // Move was valid -- redraw board to the new chess.js position.
            board.position(game.fen());
        }
    }

    // Shared move pipeline used by both drag-drop and click-to-move.
    // Returns "snapback" on illegal move so the chessboardjs drag knows
    // to animate back; returns undefined on success.
    function attemptMove(source, target, viaDrag) {
        if (analysisMode) {
            moveHistory.push(game.fen());
        }
        var move = game.move({ from: source, to: target, promotion: "q" });
        if (move === null) {
            if (analysisMode) moveHistory.pop();
            return "snapback";
        }
        clearHint();
        var uci = source + target + (move.promotion ? move.promotion : "");
        highlightLastMove(uci);
        if (analysisMode) {
            // Free-play with auto-engine eval after each move.
            handleAnalysisMove(uci);
        } else if (puzzleEnded || exploreMode) {
            // Puzzle is over (solved / failed / show solution / hint
            // give-up). Board is now a sandbox -- no validation, no
            // backend call, no engine. Just chess.js + visual update.
        } else {
            // Active solve: validate against the puzzle's solution.
            handleUserMove(uci);
        }
    }

    function setStatus(kind, msg) {
        var $s = $("#status");
        $s.removeClass("ok bad info").addClass(kind).text(msg).show();
    }

    // -------- outcome modal --------------------------------------------
    // Big, visible Correct/Wrong popup shown after a finalised puzzle
    // attempt. Auto-advances to the next puzzle if the user has the
    // "Automatically load the next puzzle" checkbox enabled.
    var autoAdvanceTimer = null;

    function showOutcomeModal(kind, title, metaHtml) {
        clearTimeout(autoAdvanceTimer);
        jQuery("#outcomeModalIcon")
            .removeClass("ok bad")
            .addClass(kind)
            .text(kind === "ok" ? "✓" : "✗");
        jQuery("#outcomeModalTitle")
            .removeClass("ok bad")
            .addClass(kind)
            .text(title);
        jQuery("#outcomeModalMeta").html(metaHtml || "");
        jQuery("#outcomeModal").show().attr("aria-hidden", "false");

        // Auto-advance: longer delay on Wrong so the user can read the solution.
        if (jQuery("#chkAutoAdvance").is(":checked")) {
            var delay = (kind === "ok") ? 1800 : 4000;
            autoAdvanceTimer = setTimeout(function () {
                closeOutcomeModal();
                loadNewPuzzle();
            }, delay);
        }
    }

    function closeOutcomeModal() {
        clearTimeout(autoAdvanceTimer);
        jQuery("#outcomeModal").hide().attr("aria-hidden", "true");
    }

    // Compose the rich middle-section text for the outcome modal.
    // - solved=true  + rated: "+5.2 rating"
    // - solved=true  + practice: "Practice -- no rating change"
    // - solved=false + rated: "-3.1 rating. Solution: Nf3 e5 Bxc5"
    // - solved=false + anonymous: "Solution: ...  -- log in to rate"
    function buildOutcomeMeta(resp, solved, scale) {
        var bits = [];
        if (resp.isAnonymous) {
            bits.push("Practice mode &mdash; <a href='Login'>log in</a> to rate");
        } else if (resp.isRated) {
            var d = resp.ratingChange || 0;
            var sign = d > 0 ? "+" : "";
            var who = solved ? "rating gained" : "rating lost";
            bits.push("<b>" + sign + d.toFixed(1) + "</b> " + who);
            if (!solved && scale < 0.99) {
                bits.push("Partial credit: " + Math.round((1 - scale) * 100) + "% of moves missed");
            }
        } else {
            bits.push("Practice (cooldown &mdash; no rating change)");
        }
        if (!solved) {
            var sol = solverMovesOnly(currentPuzzle.solutionSan || "");
            if (sol) bits.push("Solution: <b>" + escapeHtml(sol) + "</b>");
        }
        return bits.join("<br />");
    }

    // Trim the trailing opponent reply if the solution ends on one.
    // Rule: the displayed solution should always END on a solver move so
    // the user sees the puzzle's actual goal as the last position.
    //   "Bxf1 Rb1"           -> "Bxf1"         (2 ply, last is opp)
    //   "Qg4 Bxd5 Nxd5 b6 c4" -> "Qg4 Bxd5 Nxd5 b6 c4"  (5 ply, ends solver — keep all)
    //   "Qxh7+ Kxh7 Rh3#"    -> "Qxh7+ Kxh7 Rh3#"      (3 ply mate, keep all)
    //   "Nf3 e5 Bxc5 Qxc5"   -> "Nf3 e5 Bxc5"          (4 ply, last is opp)
    function solverMovesOnly(san) {
        if (!san) return "";
        var parts = san.trim().split(/\s+/);
        if (parts.length % 2 === 0) parts = parts.slice(0, -1);
        return parts.join(" ");
    }

    // Highlight the most recently played move's from + to squares so the
    // user clearly sees what just changed — especially after the engine
    // auto-plays an opponent reply during a multi-move puzzle. Uses
    // chessboard.js's per-square classes (.square-e2, .square-e4, etc.)
    // so we don't have to know orientation/piece DOM details.
    function highlightLastMove(uci) {
        // Strip the previous highlight regardless of whether `uci` is set.
        jQuery("#board .square-55d63").removeClass("highlight-last-move");
        if (!uci || uci.length < 4) return;
        var from = uci.substring(0, 2);
        var to = uci.substring(2, 4);
        jQuery("#board .square-" + from).addClass("highlight-last-move");
        jQuery("#board .square-" + to).addClass("highlight-last-move");
    }

    // Draw a single SVG arrow from one square to another. Used by the
    // analysis mode to visualise the engine's #1 best move on top of the
    // board. Re-renders the arrow on every call (single-arrow model).
    // The math derives pixel positions from the board's current width
    // and orientation; chessboard.js doesn't expose this so we recompute.
    function drawBestMoveArrow(uci) {
        var $svg = jQuery("#boardArrows");
        $svg.empty();
        if (!uci || uci.length < 4 || !board) return;
        var from = uci.substring(0, 2);
        var to = uci.substring(2, 4);
        var boardWidth = jQuery("#board").width();
        if (!boardWidth) return;
        var sq = boardWidth / 8;
        var orient = board.orientation();
        function center(square) {
            var fileIdx = square.charCodeAt(0) - 97;       // a=0..h=7
            var rankIdx = parseInt(square[1], 10) - 1;     // 1..8 -> 0..7
            var x, y;
            if (orient === "white") {
                x = fileIdx * sq + sq / 2;
                y = (7 - rankIdx) * sq + sq / 2;
            } else {
                x = (7 - fileIdx) * sq + sq / 2;
                y = rankIdx * sq + sq / 2;
            }
            return { x: x, y: y };
        }
        var a = center(from);
        var b = center(to);
        // Arrow sized like Lichess defaults: stroke about 1/10 of a square
        // and a small triangular head. Trim the line so the head doesn't
        // overshoot the destination centre, and we add tiny extension via
        // marker so the head visually arrives at the centre of the square.
        $svg.attr("viewBox", "0 0 " + boardWidth + " " + boardWidth);
        $svg.html(
            '<defs><marker id="arrHead" markerWidth="3" markerHeight="3" refX="2" refY="1.5" orient="auto" markerUnits="strokeWidth">' +
            '<path d="M0,0 L0,3 L3,1.5 z" fill="#15781b" fill-opacity="0.85"/></marker></defs>' +
            '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" ' +
            'stroke="#15781b" stroke-opacity="0.85" stroke-width="' + (sq * 0.10) + '" ' +
            'stroke-linecap="round" marker-end="url(#arrHead)"/>'
        );
    }

    function clearBestMoveArrow() {
        jQuery("#boardArrows").empty();
    }

    // Hint: highlight the from-square of the next solver move. Counts as
    // a wrong answer if used BEFORE the user has attempted anything (rating
    // drops). The board stays playable afterwards — user can still try to
    // solve the puzzle as practice. Cooldown logic on the backend prevents
    // a second rating hit when they make their real move.
    function showHint() {
        if (!solutionList.length) return;
        var nextMove = solutionList[solverIdx];
        if (!nextMove || nextMove.length < 2) return;
        var from = nextMove.substring(0, 2);

        // Pre-attempt give-up path: confirm + submit wrong + apply penalty.
        // We do NOT set puzzleEnded=true — the user can keep playing on
        // the board, and any subsequent move will be cooldown-protected
        // by the backend so they don't get double-penalised.
        if (solverIdx === 0 && !ratedReceived && !puzzleEnded) {
            var ok = confirm(
                "Use a hint?\n\n" +
                "This counts as a wrong answer — your rating will drop the " +
                "same as if you had played a wrong move. You can still play " +
                "out the puzzle normally afterwards (no further rating change)."
            );
            if (!ok) return;
            // Rating is locked, but puzzle stays open: subsequent drags
            // continue to validate against the solution and auto-play opp
            // replies, just without firing more backend calls.
            ratedReceived = true;
            recordStreakResult(false);
            $.ajax({
                url: ATTEMPT_URL, method: "POST", dataType: "json",
                data: { puzzleId: currentPuzzle.id, firstMove: "0000" },
                success: function (resp) {
                    if (resp.isAnonymous) {
                        attemptSuffix = " — Practice (log in to rate)";
                    } else if (resp.isRated) {
                        var delta = resp.ratingChange ? " (" + (resp.ratingChange > 0 ? "+" : "") + resp.ratingChange.toFixed(1) + ")" : "";
                        attemptSuffix = " — Rated" + delta;
                    } else {
                        attemptSuffix = " — Practice (cooldown, no rating change)";
                    }
                    setStatus("info", "Hint: piece on " + from + "." + attemptSuffix);
                }
            });
            setStatus("info", "Hint: piece on " + from + ".");
        }
        // For mid-solve hints (user already made a correct move) we DON'T
        // overwrite the running status message — the user is still in the
        // flow ("Good — keep going") and shouldn't feel like the puzzle
        // paused. Just drop the highlight on the from-square; that's the
        // hint. Same goes for hints used after the puzzle has ended (it's
        // a freebie, no message needed beyond the highlight).
        jQuery("#board .square-55d63").removeClass("highlight-hint");
        jQuery("#board .square-" + from).addClass("highlight-hint");
    }

    function clearHint() {
        jQuery("#board .square-55d63").removeClass("highlight-hint");
    }

    // Eval bar — show the position's evaluation as a vertical fill bar
    // alongside the board. White advantage = bar fills toward top, black
    // advantage = fills toward bottom. cp is from White's POV.
    function updateEvalBar(cp) {
        if (cp === undefined || cp === null) {
            jQuery("#evalBar").hide();
            return;
        }
        jQuery("#evalBar").show();
        // Map cp to percentage: clamp at +/-1000 = full bar.
        // Mate scores get max 100/0%.
        var pct;
        if (cp >= 99000) pct = 100;
        else if (cp <= -99000) pct = 0;
        else {
            var clamped = Math.max(-1000, Math.min(1000, cp));
            pct = 50 + (clamped / 20);  // -1000=0%, 0=50%, +1000=100%
        }
        jQuery("#evalBarFill").css("height", pct + "%");
        var label;
        if (cp >= 99000) label = "M";
        else if (cp <= -99000) label = "-M";
        else label = ((cp >= 0 ? "+" : "") + (cp / 100).toFixed(1));
        jQuery("#evalBarText").text(label);
    }

    // Take-back (analysis mode only): pop the last FEN from moveHistory
    // and restore the board. chess.js doesn't have a multi-undo so we
    // reconstruct from FEN directly — simpler and avoids edge cases like
    // promotions/castling/en-passant rebuilding.
    function takeBack() {
        if (!analysisMode || moveHistory.length === 0) return;
        var prevFen = moveHistory.pop();
        game = new Chess(prevFen);
        board.position(prevFen);
        highlightLastMove(null);  // can't reconstruct previous from-to easily
        evaluateAndDisplay();
    }

    // Reset to puzzle start: re-init the game from puzzle.fen, clear
    // history. Stays in analysis mode if user was already analysing.
    function resetToStart() {
        if (!currentPuzzle || !currentPuzzle.fen) return;
        moveHistory = [];
        game = new Chess(currentPuzzle.fen);
        board.position(currentPuzzle.fen);
        highlightLastMove(null);
        if (analysisMode) {
            evaluateAndDisplay();
        }
    }

    // Streak tracking (localStorage, browser-only — no backend cost).
    // Reset solvedToday/failedToday counts when the date rolls over.
    function getStreakState() {
        try {
            var raw = localStorage.getItem(STREAK_KEY);
            if (raw) {
                var s = JSON.parse(raw);
                var today = new Date().toISOString().slice(0, 10);
                if (s.day !== today) {
                    s.day = today;
                    s.solvedToday = 0;
                    s.failedToday = 0;
                }
                return s;
            }
        } catch (e) { /* ignore */ }
        return {
            day: new Date().toISOString().slice(0, 10),
            solvedToday: 0, failedToday: 0,
            currentStreak: 0, bestStreak: 0
        };
    }
    function saveStreakState(s) {
        try { localStorage.setItem(STREAK_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
    }
    function recordStreakResult(solved) {
        var s = getStreakState();
        if (solved) {
            s.solvedToday += 1;
            s.currentStreak += 1;
            if (s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak;
        } else {
            s.failedToday += 1;
            s.currentStreak = 0;
        }
        saveStreakState(s);
        renderStreakBox();
    }
    function renderStreakBox() {
        var s = getStreakState();
        if (s.solvedToday === 0 && s.failedToday === 0 && s.currentStreak === 0) {
            jQuery("#streakBox").hide();
            return;
        }
        var html = "Today: <b>" + s.solvedToday + "</b> solved";
        if (s.failedToday > 0) html += ", <b>" + s.failedToday + "</b> failed";
        if (s.currentStreak >= 3) {
            html += " &middot; <span class='streak-fire'>🔥 " + s.currentStreak + " in a row!</span>";
        }
        if (s.bestStreak >= 5 && s.bestStreak > s.currentStreak) {
            html += " &middot; best: " + s.bestStreak;
        }
        jQuery("#streakBox").html(html).show();
    }

    // Tab switcher — hides all panes, shows one.
    function showTab(name) {
        jQuery(".tab-nav button").removeClass("active");
        jQuery("#paneBoard, #paneHistory, #paneStats").hide();
        if (name === "puzzle") { jQuery("#tabPuzzle").addClass("active"); jQuery("#paneBoard").show(); }
        else if (name === "history") { jQuery("#tabHistory").addClass("active"); jQuery("#paneHistory").show(); loadHistory("failed"); }
        else if (name === "stats") { jQuery("#tabStats").addClass("active"); jQuery("#paneStats").show(); loadThemeStats(); }
    }

    // History tab: fetch list, render rows, clicking a row loads that
    // puzzle into the board (practice mode — backend won't double-rate
    // because the cooldown logic still applies on /PuzzleAttempt.ashx).
    function loadHistory(type) {
        jQuery("#historyList").html("<div style='color:#888;padding:10px;'>Loading…</div>");
        jQuery.getJSON("PuzzleHistory.ashx", { type: type }, function (resp) {
            if (resp.isAnonymous) {
                jQuery("#historyList").html("<div style='color:#888;padding:10px;'>Log in to see your puzzle history.</div>");
                return;
            }
            if (!resp.items || resp.items.length === 0) {
                jQuery("#historyList").html("<div style='color:#888;padding:10px;'>No " + type + " puzzles yet.</div>");
                return;
            }
            var html = "";
            for (var i = 0; i < resp.items.length; i++) {
                var p = resp.items[i];
                var badge = p.solved
                    ? '<span class="badge solved">solved</span>'
                    : '<span class="badge failed">failed</span>';
                var levelBadge = '<span class="badge">L' + p.level + '</span>';
                var when = p.insertDate ? p.insertDate.replace("T", " ").substring(0, 16) : "";
                var name = (p.eventName || "Game") + (p.roundNumber ? " R" + p.roundNumber : "");
                html += "<div class='history-row' data-id='" + p.id + "'>";
                html += badge + levelBadge;
                html += "<span style='flex:1;'>" + escapeHtml(name) + "</span>";
                html += "<span style='color:#888;font-size:11px;'>" + escapeHtml(when) + "</span>";
                html += "</div>";
            }
            jQuery("#historyList").html(html);
            jQuery(".history-row").on("click", function () {
                var id = jQuery(this).data("id");
                replayPuzzleByID(id);
            });
        });
    }

    // Load a specific puzzle from /PuzzleByID.ashx and switch to the
    // Puzzle tab. The puzzle is in normal solve mode (cooldown applies
    // server-side, so this won't change rating if recently attempted).
    function replayPuzzleByID(id) {
        jQuery.getJSON("PuzzleByID.ashx", { id: id }, function (resp) {
            if (!resp || !resp.id) {
                alert("Could not load puzzle.");
                return;
            }
            currentPuzzle = resp;
            jQuery("#status").hide();
            jQuery("#puzzleMeta").html(renderMeta(resp));
            initBoard(resp);
            showTab("puzzle");
        });
    }

    // Convert raw theme tag (kebab-case from the generator) into a nice
    // human-readable label. Special-cases compound terms that need
    // capitalisation tweaks ("X-Ray", "back-rank-mate" -> "Back Rank Mate").
    function formatThemeName(t) {
        if (!t) return "";
        return t.split("-").map(function (word) {
            // "x" should be uppercased ("x-ray" -> "X-Ray").
            if (word === "x") return "X";
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(" ").replace(/Mate In (\d+)/, "Mate-in-$1");
    }

    // Theme stats tab: bar chart of solve rate per theme.
    function loadThemeStats() {
        jQuery("#statsList").html("<div style='color:#888;'>Loading…</div>");
        jQuery.getJSON("PuzzleThemeStats.ashx", function (resp) {
            if (resp.isAnonymous) {
                jQuery("#statsList").html("<div style='color:#888;'>Log in to see your theme stats.</div>");
                return;
            }
            if (!resp.items || resp.items.length === 0) {
                jQuery("#statsList").html("<div style='color:#888;'>Solve a few more puzzles (need at least 3 of any theme) to see stats.</div>");
                return;
            }
            var html = "";
            for (var i = 0; i < resp.items.length; i++) {
                var s = resp.items[i];
                var pct = Math.round(s.solveRate * 100);
                html += "<div class='theme-stats-row'>";
                html += "<span class='name'>" + escapeHtml(formatThemeName(s.theme)) + "</span>";
                html += "<span class='bar'><span class='bar-fill' style='width:" + pct + "%;'></span></span>";
                html += "<span class='pct'>" + pct + "% (" + s.solved + "/" + s.total + ")</span>";
                html += "</div>";
            }
            jQuery("#statsList").html(html);
        });
    }

    // Called after every user move. The first move goes to the backend for
    // rating + logging; subsequent moves are validated client-side against
    // the cached solutionList that PuzzleRandom.ashx already returned.
    function handleUserMove(uci) {
        var expected = (solutionList[solverIdx] || "").toLowerCase();
        var userMove = uci.toLowerCase();
        // Lichess and our generator use the same UCI form (e.g. "e7e8q"),
        // so a direct case-insensitive compare is enough.
        var correct = (userMove === expected);

        // New flow: rating is submitted at puzzle END (success OR failure),
        // never on first move. This way wrong-on-continuation still drops
        // the rating, just at a reduced "scale" because the user got the
        // earlier moves right (partial credit). Cache the first move to
        // send on a successful completion.
        if (solverIdx === 0) {
            firstMoveCache = uci;
        }

        if (!correct) {
            // Wrong move at any point — submit failure with scale based on
            // how far the user got. solverIdx counts plies; total solver
            // moves = ceil(solutionList.length / 2). Scale = 1.0 - progress
            // means: more moves correct → less penalty.
            puzzleEnded = true;
            $("#btnTryAgain").show();
            // ALWAYS reset streak immediately when a wrong move happens —
            // independent of the (async) backend submit so that a slow or
            // failing AJAX can never leave the streak counter inflated.
            recordStreakResult(false);
            if (!ratedReceived) {
                var totalSolverMoves = Math.ceil(solutionList.length / 2);
                var solverMovesDone = Math.floor(solverIdx / 2);
                var scale = totalSolverMoves > 0
                    ? Math.max(0.2, 1.0 - (solverMovesDone / totalSolverMoves))
                    : 1.0;
                // 4th arg = "streak already recorded above" so the callback
                // doesn't double-decrement.
                submitAttemptScaled(uci, false, scale, true);
            } else {
                setStatus("bad", "Wrong on continuation. Click Try again to retry.");
            }
            return;
        }

        // Move accepted. Advance: auto-play opponent's forced reply (if any),
        // then either prompt next solver move or declare victory.
        solverIdx += 1;  // we just consumed a solver move (even index)
        playForcedReplyThenContinue();
    }

    function playForcedReplyThenContinue() {
        var replyUci = solutionList[solverIdx];
        if (!replyUci) {
            // No more moves in the solution: user just made the final
            // solver move (typical for mate puzzles). Puzzle complete.
            puzzleEnded = true;
            if (!ratedReceived) {
                submitAttemptScaled(firstMoveCache, true, 1.0);
            } else {
                setStatus("ok", "Correct! Puzzle complete.");
            }
            return;
        }
        // If there's no further solver move after this opponent reply,
        // the user has already done their work — auto-playing the final
        // forced reply just adds noise. Declare complete immediately.
        var nextSolverMove = solutionList[solverIdx + 1];
        if (!nextSolverMove) {
            puzzleEnded = true;
            if (!ratedReceived) {
                submitAttemptScaled(firstMoveCache, true, 1.0);
            } else {
                setStatus("ok", "Correct! Puzzle complete.");
            }
            return;
        }
        // There IS another user move ahead — play the forced reply so the
        // user sees the position they need to act on. Brief delay first so
        // the user sees their own move land before the reply.
        setTimeout(function () {
            var reply = game.move({
                from: replyUci.substring(0, 2),
                to: replyUci.substring(2, 4),
                promotion: replyUci.length >= 5 ? replyUci.substring(4, 5) : undefined
            });
            if (reply === null) {
                // Should never happen (solution UCI comes from the engine),
                // but fail safe: end the puzzle.
                puzzleEnded = true;
                setStatus("bad", "Solution mismatch. Solution: " + solverMovesOnly(currentPuzzle.solutionSan) + attemptSuffix);
                return;
            }
            board.position(game.fen());
            highlightLastMove(replyUci);
            solverIdx += 1;  // consumed opponent reply (odd index)
            // Save this position as the new "Try again" checkpoint — if
            // the user botches their next move, retry should land here,
            // not at the original puzzle start.
            checkpointFen = game.fen();
            checkpointSolverIdx = solverIdx;
            setStatus("info", "Good — keep going.");
        }, 350);
    }

    // Submit a finalized puzzle attempt. uci = the user's actual first move
    // (used when solved=true). solved = true for full solution complete,
    // false for any wrong move along the way. scale (0-1) = how much of
    // the Glicko-2 change to apply — late-fail uses scale<1 so partial
    // credit reduces the rating drop.
    function submitAttemptScaled(uci, solved, scale, streakAlreadyRecorded) {
        if (ratedReceived) return;
        var firstMoveToSend = solved ? uci : "0000";
        $("#btnShowSolution").prop("disabled", true);
        $.ajax({
            url: ATTEMPT_URL, method: "POST", dataType: "json",
            data: {
                puzzleId: currentPuzzle.id,
                firstMove: firstMoveToSend,
                scale: scale.toFixed(3)
            },
            success: function (resp) {
                if (resp.isAnonymous) {
                    attemptSuffix = " — Practice (log in to rate)";
                } else if (resp.isRated) {
                    var delta = resp.ratingChange
                        ? " (" + (resp.ratingChange > 0 ? "+" : "") + resp.ratingChange.toFixed(1) + ")"
                        : "";
                    var partialNote = (scale < 0.99 && !solved)
                        ? " (partial penalty — got " + Math.round((1 - scale) * 100) + "% of moves right)"
                        : "";
                    attemptSuffix = " — Rated" + delta + partialNote;
                } else {
                    attemptSuffix = " — Practice (cooldown, no rating change)";
                }
                ratedReceived = true;
                // Streak already updated synchronously in the wrong-move
                // path; only record here if not already done.
                if (!streakAlreadyRecorded) {
                    recordStreakResult(solved);
                }
                if (solved) {
                    setStatus("ok", "Correct! Puzzle complete." + attemptSuffix);
                    showOutcomeModal(
                        "ok",
                        "Correct!",
                        buildOutcomeMeta(resp, /*solved*/true, /*scale*/scale)
                    );
                } else {
                    var msg = (scale < 0.99)
                        ? "Wrong on continuation. Click Try again to retry."
                        : "Wrong. Click Try again to retry.";
                    setStatus("bad", msg + attemptSuffix);
                    showOutcomeModal(
                        "bad",
                        "Wrong",
                        buildOutcomeMeta(resp, /*solved*/false, /*scale*/scale)
                    );
                }
                $("#btnShowSolution").prop("disabled", false);
            },
            error: function (xhr) {
                setStatus("bad", "Server error: " + (xhr.responseText || xhr.statusText));
                $("#btnShowSolution").prop("disabled", false);
                puzzleEnded = true;
            }
        });
    }

    // Backwards-compat shim for any old call (Hint give-up etc.).
    function submitAttempt(uci, isCorrect) {
        submitAttemptScaled(uci, isCorrect, 1.0);
    }

    function loadNewPuzzle() {
        setStatus("info", "Loading new puzzle...");
        var params = {
            level: $("#ddlLevel").val(),
            theme: $("#ddlTheme").val() || ""
        };
        $.getJSON(RANDOM_URL, params, function (resp) {
            if (!resp || !resp.id) {
                setStatus("info", "No eligible puzzle for this filter — try a different level/theme combination.");
                return;
            }
            currentPuzzle = resp;
            $("#status").hide();
            $("#puzzleMeta").html(renderMeta(resp));
            initBoard(resp);
        });
    }

    // Restore the board to the checkpoint position — the state right
    // before the user made the wrong move. For first-move failures this
    // is the puzzle's starting position; for multi-move puzzles where the
    // user got the 1st move right but the 3rd move wrong, this lands at
    // "after move 2" so they only retry the part they botched.
    //
    // Backend rating is already finalised, so additional attempts here are
    // pure practice (cooldown protects against double-rating regardless).
    function tryAgainCurrent() {
        if (!currentPuzzle) return;
        $("#status").hide();
        $("#btnTryAgain").hide();
        if (!checkpointFen) {
            // No checkpoint somehow — fall back to full reset.
            initBoard(currentPuzzle);
            return;
        }
        puzzleEnded = false;
        exploreMode = false;
        analysisMode = false;
        $("#btnAnalyze").text("Analyze");
        $("#analysisPanel").hide();
        $("#btnTakeBack").hide();
        $("#btnResetToStart").hide();
        $("#evalBar").hide();
        clearBestMoveArrow();
        clearHint();
        // Restore game + board to checkpoint position.
        game = new Chess(checkpointFen);
        board.position(checkpointFen);
        solverIdx = checkpointSolverIdx;
        highlightLastMove(null);
    }

    function renderMeta(p) {
        var html = "";

        // Event line: "NACCL Season 10 · Round 6, Board 116    [view game ↗]"
        var hasEvent = p.eventName || p.roundNumber > 0;
        if (hasEvent) {
            html += "<div class='meta-event'>";
            html += "<b>" + escapeHtml(p.eventName || "Game") + "</b>";
            if (p.roundNumber > 0) {
                html += " &middot; Round " + p.roundNumber;
            }
            if (p.gameURL) {
                html += " <a class='game-link' target='_blank' rel='noopener' href='" +
                        escapeAttr(p.gameURL) + "' title='View game on " +
                        escapeAttr(p.platform || "") + "'>view game &#8599;</a>";
            }
            html += "</div>";
        }

        html += "<div class='meta-roster'>";
        html += renderPlayer("white", "&#9817;", p.whiteName, p.whiteTeam);
        html += renderPlayer("black", "&#9823;", p.blackName, p.blackTeam);
        html += "</div>";

        html += "<div style='margin-top:8px;'><span class='pill level'>Level " + p.level + "</span></div>";
        return html;
    }

    function renderPlayer(color, dot, name, team) {
        var html = "<div class='player " + color + "'>";
        html += "<span class='dot' aria-hidden='true'>" + dot + "</span>";
        html += "<span class='name'>" + escapeHtml(name || "Unknown") + "</span>";
        if (team) html += "<span class='team'>" + escapeHtml(team) + "</span>";
        html += "</div>";
        return html;
    }

    function escapeAttr(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    // Show solution: counts as a wrong answer (same as Analyze-without-attempt
    // and any other "give up" path). User sees the full solution played out
    // on the board, then they can hit Try again to retry as practice.
    function showSolution() {
        if (!currentPuzzle || !currentPuzzle.solutionUci) return;

        // If puzzle is already finished (correct or wrong), no penalty —
        // just play out the solution. The rating was already finalised on
        // the first attempt.
        var alreadyDone = puzzleEnded || ratedReceived;

        if (!alreadyDone) {
            // Pre-attempt give-up: confirm + submit wrong + apply penalty.
            var ok = confirm(
                "Show the solution without solving?\n\n" +
                "This counts as a wrong answer — your rating will drop the " +
                "same as if you had played a wrong move."
            );
            if (!ok) return;

            puzzleEnded = true;
            $("#btnTryAgain").show();
            // Fire the wrong-attempt log so backend records it + Glicko-2.
            $.ajax({
                url: ATTEMPT_URL, method: "POST", dataType: "json",
                data: { puzzleId: currentPuzzle.id, firstMove: "0000" },
                success: function (resp) {
                    if (resp.isAnonymous) {
                        attemptSuffix = " — Practice (log in to rate)";
                    } else if (resp.isRated) {
                        var delta = resp.ratingChange ? " (" + (resp.ratingChange > 0 ? "+" : "") + resp.ratingChange.toFixed(1) + ")" : "";
                        attemptSuffix = " — Rated" + delta;
                    } else {
                        attemptSuffix = " — Practice (cooldown, no rating change)";
                    }
                    setStatus("bad", "Solution shown — playing it out." + attemptSuffix);
                    recordStreakResult(false);
                }
            });
            setStatus("bad", "Solution shown — playing it out.");
        }

        // Reset board to puzzle start, then auto-play every move with
        // 600ms between moves so user can follow the line visually.
        game = new Chess(currentPuzzle.fen);
        board.position(currentPuzzle.fen);
        highlightLastMove(null);

        var moves = currentPuzzle.solutionUci.trim().split(/\s+/);
        // Stop after the LAST solver move (even index) — don't play out
        // the final opponent reply since that's just noise. For an even-
        // length solution like [solver, opp] we play just [solver]. For
        // odd-length (e.g. mate-in-2 = [solver, opp, solver_mate]) we
        // play all three because the last move IS the solver's mate.
        var lastIdx = (moves.length % 2 === 0) ? moves.length - 2 : moves.length - 1;
        var i = 0;
        function playNext() {
            if (i > lastIdx) {
                // Solution playback done — let user explore the resulting
                // position freely (drag any piece, chess rules apply).
                exploreMode = true;
                setStatus("bad", "Solution: " + solverMovesOnly(currentPuzzle.solutionSan) +
                          " — board free to explore." + attemptSuffix);
                return;
            }
            var uci = moves[i++];
            var move = game.move({
                from: uci.substring(0, 2),
                to: uci.substring(2, 4),
                promotion: uci.length >= 5 ? uci.substring(4, 5) : undefined
            });
            if (move) {
                board.position(game.fen());
                highlightLastMove(uci);
            }
            setTimeout(playNext, 600);
        }
        playNext();
    }

    // Engine analysis runs entirely in the browser via Stockfish.js
    // (a Web Worker spun up from /stockfish.js). No server round-trip,
    // no Python backend, works on plain static hosting. The trade-off
    // vs native Stockfish is ~2-3x slower at the same depth, but for
    // puzzle review at depth 14 / multipv 3 it returns in ~1-2 seconds
    // which is fast enough for interactive use.

    // === Stockfish.js Web Worker driver ===
    // The worker loads stockfish.js once on first analysis request and
    // is reused for the lifetime of the page. UCI protocol: we send
    // "position fen X" + "go depth N", then parse the streaming "info"
    // lines for cp / pv data and finalize on "bestmove".
    var _sfWorker = null;
    var _sfCurrent = null;   // currently-running job (null when idle)
    var _sfQueue = [];       // pending jobs — only the most-recent is kept
    var _sfReady = false;    // becomes true after engine emits 'uciok'

    function _initStockfish() {
        if (_sfWorker) return;
        try {
            _sfWorker = new Worker('/puzzle/stockfish.js');
        } catch (e) {
            console.error('[sf] Failed to construct worker:', e);
            return;
        }
        _sfWorker.onerror = function (e) {
            console.error('[sf] Worker error:', e.message || e);
            if (_sfCurrent) {
                var p = _sfCurrent; _sfCurrent = null;
                p.resolve(null);
            }
        };
        _sfWorker.onmessage = function (ev) {
            var line = String(ev.data || '');
            // Diagnostic — visible in browser DevTools console (F12)
            if (line && line.length < 200) console.log('[sf<-]', line);
            // Until 'uciok' arrives, queue jobs but do NOT run them.
            // Sending 'go' before the engine finished booting causes
            // the bestmove response to be silently dropped.
            if (!_sfReady) {
                if (line.indexOf('uciok') === 0) {
                    _sfReady = true;
                    console.log('[sf] uciok received, draining queue');
                    _sfRunNext();
                }
                return;
            }
            if (!_sfCurrent) return;
            if (line.indexOf('info ') === 0 && line.indexOf(' pv ') !== -1) {
                _sfParseInfo(line);
            } else if (line.indexOf('bestmove') === 0) {
                _sfFinalize();
                _sfRunNext();
            }
        };
        // Single-threaded asm.js Stockfish — no Threads option needed.
        _sfWorker.postMessage('uci');
    }

    function _sfParseInfo(line) {
        var tokens = line.split(/\s+/);
        var mp = 1, scoreType = null, scoreVal = 0, pvIdx = -1;
        for (var i = 0; i < tokens.length; i++) {
            if (tokens[i] === 'multipv') mp = +tokens[i + 1];
            else if (tokens[i] === 'score') { scoreType = tokens[i + 1]; scoreVal = +tokens[i + 2]; }
            else if (tokens[i] === 'pv') { pvIdx = i + 1; break; }
        }
        if (!scoreType || pvIdx < 0) return;
        var pvUci = [];
        for (var j = pvIdx; j < tokens.length; j++) {
            if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(tokens[j])) pvUci.push(tokens[j]);
            else break;
        }
        if (!pvUci.length) return;
        // Stockfish reports cp from side-to-move POV; we want White POV
        // (matches the old server contract so the rest of the UI doesn't
        // need to change).
        var cp;
        if (scoreType === 'cp') {
            cp = scoreVal;
        } else {
            // Mate score: positive means side-to-move mates in N; convert
            // to a large signed cp the rest of the code can detect via
            // the abs() > 9000 threshold (and >= 99000 for our own UI).
            cp = scoreVal > 0 ? (99999 - scoreVal) : (-99999 - scoreVal);
        }
        if (_sfCurrent.sideToMove === 'b') cp = -cp;
        _sfCurrent.lines[mp - 1] = { cp: cp, pv_uci: pvUci };
    }

    function _sfFinalize() {
        var p = _sfCurrent;
        _sfCurrent = null;
        // Convert each PV from UCI to SAN by replaying on a fresh chess.js
        // board starting from the analyzed FEN. SAN is what the analysis
        // panel actually displays.
        for (var i = 0; i < p.lines.length; i++) {
            var line = p.lines[i];
            if (!line) continue;
            var tmp = new Chess(p.fen);
            var san = [];
            for (var j = 0; j < line.pv_uci.length; j++) {
                var uci = line.pv_uci[j];
                var move = { from: uci.substring(0, 2), to: uci.substring(2, 4) };
                if (uci.length === 5) move.promotion = uci.substring(4, 5);
                var m = null;
                try { m = tmp.move(move); } catch (e) { break; }
                if (!m) break;
                san.push(m.san);
            }
            line.pv_san = san;
        }
        var filtered = [];
        for (var k = 0; k < p.lines.length; k++) if (p.lines[k]) filtered.push(p.lines[k]);
        var top = filtered[0];
        p.resolve({
            cp: top ? top.cp : 0,
            lines: filtered,
            pv_san: top ? top.pv_san : []
        });
    }

    function _sfRunNext() {
        if (_sfCurrent || !_sfQueue.length) return;
        var job = _sfQueue.shift();
        _sfCurrent = job;
        _sfWorker.postMessage('setoption name MultiPV value ' + job.multipv);
        _sfWorker.postMessage('position fen ' + job.fen);
        _sfWorker.postMessage('go depth ' + job.depth);
    }

    // Public API: returns a Promise that resolves to { cp, lines, pv_san }
    // matching the old server response shape. If a previous evaluation is
    // still running we drop any queued (not-yet-started) jobs and stop the
    // running one — the queued newer FEN will start as soon as bestmove
    // arrives. This keeps rapid navigation snappy.
    function evalWithStockfish(fen, depth, mpv) {
        _initStockfish();
        if (!_sfWorker) return Promise.reject(new Error('Stockfish not available'));
        return new Promise(function (resolve) {
            var sideToMove = (fen.split(' ')[1] || 'w');
            var job = { fen: fen, sideToMove: sideToMove, depth: depth, multipv: mpv, lines: [], resolve: resolve };
            while (_sfQueue.length) _sfQueue.shift().resolve(null);
            _sfQueue.push(job);
            if (_sfCurrent) {
                _sfWorker.postMessage('stop');
            } else {
                _sfRunNext();
            }
        });
    }

    function formatCp(cp, povWhite) {
        // cp comes in from White's POV (matches old server contract).
        // Display from the side-to-move's POV so puzzle authors/users see
        // "+3.2" for the attacker, regardless of color.
        var sign = povWhite ? cp : -cp;
        if (sign >= 99000) {
            // Distance to mate is encoded as 99999 - dist (see _sfParseInfo).
            var distW = 99999 - sign;
            return distW > 0 ? ("M" + distW) : "M";
        }
        if (sign <= -99000) {
            var distB = 99999 + sign;
            return distB > 0 ? ("-M" + distB) : "-M";
        }
        var pawns = sign / 100;
        return (pawns >= 0 ? "+" : "") + pawns.toFixed(2);
    }

    // Toggle handler for the Analyze button. Behaviour:
    //   1) If puzzle hasn't been attempted yet → confirm "give up" (counts
    //      as wrong, applies rating penalty), then enter analysis mode.
    //   2) If puzzle is over (correct or wrong) → enter analysis mode.
    //   3) If already in analysis mode → exit (just hides the panel,
    //      keeps the board state since the puzzle is already finished).
    function runAnalysis() {
        if (!game) return;

        // Already analysing → toggle off.
        if (analysisMode) {
            analysisMode = false;
            $("#btnAnalyze").text("Analyze");
            $("#analysisPanel").hide();
            $("#btnTakeBack").hide();
            $("#btnResetToStart").hide();
            $("#evalBar").hide();
            clearBestMoveArrow();
            return;
        }

        // Pre-attempt give-up confirmation.
        if (solverIdx === 0 && !ratedReceived && !puzzleEnded) {
            var ok = confirm(
                "Show engine without attempting?\n\n" +
                "This counts as a wrong answer — your rating will drop the " +
                "same as if you had played a wrong move."
            );
            if (!ok) return;
            puzzleEnded = true;
            $("#btnTryAgain").show();
            $.ajax({
                url: ATTEMPT_URL, method: "POST", dataType: "json",
                data: { puzzleId: currentPuzzle.id, firstMove: "0000" },
                success: function (resp) {
                    if (resp.isAnonymous) {
                        attemptSuffix = " — Practice (log in to rate)";
                    } else if (resp.isRated) {
                        var delta = resp.ratingChange ? " (" + (resp.ratingChange > 0 ? "+" : "") + resp.ratingChange.toFixed(1) + ")" : "";
                        attemptSuffix = " — Rated" + delta;
                    } else {
                        attemptSuffix = " — Practice (cooldown, no rating change)";
                    }
                    setStatus("bad", "Gave up — engine view." + attemptSuffix);
                }
            });
            setStatus("bad", "Gave up — engine view.");
        }

        // Enter analysis mode: unlock board for free play, show panel,
        // run an immediate eval on current position. After this point any
        // user move will trigger handleAnalysisMove → engine reply +
        // re-evaluation. Puzzle rating is already finalised so playing
        // around here has no rating effect.
        analysisMode = true;
        moveHistory = [];  // fresh undo stack for this analysis session
        $("#btnAnalyze").text("Exit analysis");
        $("#analysisPanel").show();
        $("#btnTakeBack").show();
        $("#btnResetToStart").show();
        evaluateAndDisplay();
    }

    // Evaluate the current position with Stockfish.js (browser worker)
    // and render top-3 PV lines into the analysis panel. Used both as a
    // one-shot snapshot and after every move in analysisMode to keep the
    // panel live. Same response shape as the old server contract:
    //   { cp, lines: [{cp, pv_uci, pv_san}, ...], pv_san }
    // so the rendering code below didn't need to change.
    function evaluateAndDisplay(callback) {
        if (!game) return;
        var fen = game.fen();
        var whiteToMove = (fen.split(" ")[1] === "w");
        $("#analysisFen").text(fen.split(" ").slice(0, 2).join(" "));
        $("#analysisLines").html("<div style='color:#888;'>Engine thinking…</div>");
        evalWithStockfish(fen, 14, 3).then(function (resp) {
            // resp is null when this call was superseded by a newer one
            // (rapid navigation). Just bail; the newer call will refresh.
            if (!resp) { if (callback) callback(null); return; }
            var html = "";
            if (resp.lines && resp.lines.length > 0) {
                for (var i = 0; i < resp.lines.length; i++) {
                    var line = resp.lines[i];
                    var evalStr = formatCp(line.cp, whiteToMove);
                    var color = (whiteToMove ? line.cp : -line.cp) >= 0 ? "#1a7f37" : "#cf222e";
                    var pv = (line.pv_san || []).slice(0, 8).join(" ");
                    html += "<div style='padding:6px 0;border-bottom:1px solid #f0f0f0;'>";
                    html += "<b style='color:" + color + ";min-width:60px;display:inline-block;'>" + evalStr + "</b> ";
                    html += "<span style='color:#333;'>" + escapeHtml(pv) + "</span>";
                    html += "</div>";
                }
                html += "<div style='margin-top:8px;font-size:12px;color:#5d82a8;'>" +
                        "Move pieces for both sides freely — the analysis updates after each move so you can explore any continuation you want, including replies you fear from the opponent." +
                        "</div>";
                if (resp.lines[0] && resp.lines[0].pv_uci && resp.lines[0].pv_uci[0]) {
                    drawBestMoveArrow(resp.lines[0].pv_uci[0]);
                } else {
                    clearBestMoveArrow();
                }
                updateEvalBar(resp.lines[0].cp);
            } else {
                html = "<div style='color:#888;'>No engine output.</div>";
                clearBestMoveArrow();
                updateEvalBar(null);
            }
            $("#analysisLines").html(html);
            if (callback) callback(resp);
        }).catch(function (err) {
            var msg = "Engine unavailable: " + (err && err.message ? err.message : "unknown error") +
                      ". Try a hard refresh (Ctrl+Shift+R) to reload the engine.";
            $("#analysisLines").html("<div style='color:#cf222e;'>" + escapeHtml(msg) + "</div>");
            if (callback) callback(null);
        });
    }

    // User played a move while analysisMode is on. The board already shows
    // the new position (game.move() was called by onDrop). All we do here
    // is refresh the engine analysis panel — we DON'T auto-play any reply.
    // The user controls both sides so they can explore feared continuations
    // for the opponent (or any line they're curious about).
    function handleAnalysisMove(uci) {
        $("#analysisFen").text(game.fen().split(" ").slice(0, 2).join(" "));
        evaluateAndDisplay();
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    // Share: render the puzzle's deep link as a clickable URL inside the
    // status bar. Right-click "Copy link" to share, or click to open in a
    // new tab. The URL format is https://host/default?puzzle=12345 — the
    // ?puzzle=N handler in $(document).ready loads it on the recipient's
    // browser.
    function sharePuzzle() {
        if (!currentPuzzle || !currentPuzzle.id) return;
        var url  = window.location.origin + window.location.pathname + "?puzzle=" + currentPuzzle.id;
        var safe = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
        var $s = $("#status");
        $s.removeClass("ok bad").addClass("info").html(
            "<a href='" + safe + "' target='_blank' rel='noopener' " +
            "style='color:#1a4ea0;word-break:break-all;'>" + safe + "</a>"
        ).show();
    }

    $(document).ready(function () {
        // If the URL has ?puzzle=N, load that specific puzzle instead of the
        // server-rendered random one. Lets shared links open the same puzzle
        // for everyone. Falls back to INITIAL_PUZZLE on any error.
        var urlPuzzleID = 0;
        var qs = window.location.search;
        if (qs && qs.length > 1) {
            var m = qs.match(/[?&]puzzle=(\d+)/);
            if (m) urlPuzzleID = parseInt(m[1], 10) || 0;
        }
        if (urlPuzzleID > 0) {
            // replayPuzzleByID does the AJAX fetch + initBoard switch for us.
            replayPuzzleByID(urlPuzzleID);
        } else {
            initBoard(INITIAL_PUZZLE);
        }
        $("#btnNewPuzzle").on("click", loadNewPuzzle);
        $("#btnTryAgain").on("click", tryAgainCurrent);
        $("#btnShowSolution").on("click", showSolution);
        $("#btnAnalyze").on("click", runAnalysis);
        $("#btnShare").on("click", sharePuzzle);
        $("#btnHint").on("click", showHint);
        $("#btnTakeBack").on("click", takeBack);
        $("#btnResetToStart").on("click", resetToStart);
        $("#ddlLevel").on("change", loadNewPuzzle);
        $("#ddlTheme").on("change", loadNewPuzzle);
        // Tab nav
        $("#tabPuzzle").on("click", function () { showTab("puzzle"); });
        $("#tabHistory").on("click", function () { showTab("history"); });
        $("#tabStats").on("click", function () { showTab("stats"); });
        // History sub-filter buttons
        $("#btnHistFailed").on("click", function () { loadHistory("failed"); });
        $("#btnHistSolved").on("click", function () { loadHistory("solved"); });
        $("#btnHistAll").on("click", function () { loadHistory("all"); });
        // Outcome modal actions
        $("#outcomeModalNext").on("click", function () { closeOutcomeModal(); loadNewPuzzle(); });
        $("#outcomeModalClose").on("click", closeOutcomeModal);
        $(".outcome-modal-backdrop").on("click", closeOutcomeModal);
        // Auto-advance checkbox: persist across page reloads via localStorage.
        try {
            var saved = localStorage.getItem("puzzle_auto_advance");
            if (saved === "1") $("#chkAutoAdvance").prop("checked", true);
        } catch (e) { /* localStorage unavailable -- ignore */ }
        $("#chkAutoAdvance").on("change", function () {
            try { localStorage.setItem("puzzle_auto_advance", this.checked ? "1" : "0"); }
            catch (e) { /* ignore */ }
        });
        // Initial streak render
        renderStreakBox();

        var resizeTimer = null;
        $(window).on("resize", function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                if (board) board.resize();
            }, 150);
        });
    });
</script>

                
<footer class="max-w-2xl mx-auto text-center pb-20 px-4" style="padding-top:50px;">
    <div class="flex items-center justify-center gap-x-6 mb-10">
        <a href="https://www.chess.com/club/north-american-corporate-chess-league" target="_blank">
            <img src="images/chesscomlogotr.png" alt="Chess.com" class="h-8">
        </a>
        <a href="https://www.linkedin.com/company/nacorporatechess/" target="_blank">
            <img src="images/linkedin.png" alt="LinkedIn" class="h-7">
        </a>
    </div>

    <div class="grid sm:flex justify-center items-center sm:divide-x-[1px] gap-y-3 divide-black text-black text-center">
        <a href="." class="text-sm inline-block px-4">Puzzle</a>
        <a href="Leaderboard" class="text-sm inline-block px-4">Puzzle Leaderboard</a>
        <a href="https://nacorporatechess.com" target="_blank" class="text-sm inline-block px-4">NACCL</a>
    </div>

    <small class="block text-sm text-black mt-12">© 2026 North American Corporate Chess League. All Rights Reserved.</small>

    
</footer>

            </div>
        </div>
    </form>
</div>

    <!-- StatCounter Code for Default Guide -->
    <script type="text/javascript">
        var sc_account = 'BATARA';
        var sc_store = 'nocix.stream,3341.ssch';
        var sc_ori = 'BATARA';
        var sc_app = 'Chess Stream';
        var sc_place = 'Production';
        var sc_project = 11408672;
        var sc_invisible = 1;
        var sc_security = "a01f00cf";
    </script>


<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js/v4513226cdae34746b4dedf0b4dfa099e1781791509496" integrity="sha512-ZE9pZaUXND66v380QUtch/5sE9tPFh2zg45pR2PB0CVkCtOREv2AJKkSidISWkysEuQ0EH8faUU5du78bx87UQ==" data-cf-beacon="{&quot;version&quot;:&quot;2024.11.0&quot;,&quot;token&quot;:&quot;5ef5c46470e048288afddb2656572035&quot;,&quot;r&quot;:1}" crossorigin="anonymous"></script>


<img src="/puzzle/assets/images/chesspieces/wR.png" id="36ca-a7e2-82e8-2c39-811d-b2f1-851d-e374" alt="" class="piece-417db" data-piece="wP" style="width: 59px; height: 59px; position: absolute; left: 483px; top: 610.5px; display: none;"></body></html>