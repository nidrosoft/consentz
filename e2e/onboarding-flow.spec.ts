import { expect, test } from "@playwright/test";

const STRONG_PASSWORD = "ConsentzFlow1!Aa";

test.describe("Full onboarding → assessment → dashboard → sign-out", () => {
    test("signup, complete all assessment questions, view results, reach dashboard", async ({
        page,
    }) => {
        const email = `e2e.${Date.now()}@mailinator.com`;

        // ─── 1. Sign Up ────────────────────────────────────────────────
        await page.goto("/sign-up");
        await page.locator("#firstName").fill("Playwright");
        await page.locator("#lastName").fill("Tester");
        await page.locator("#email").fill(email);
        await page.locator("#password").fill(STRONG_PASSWORD);
        await page.getByRole("button", { name: /Create account/i }).click();

        await page.waitForTimeout(3000);

        if (
            await page
                .getByRole("heading", { name: /Check your email/i })
                .isVisible()
                .catch(() => false)
        ) {
            test.skip(
                true,
                "Supabase requires email confirmation — disable confirm_email for E2E.",
            );
        }

        // ─── 2. Welcome — Select Service Type ──────────────────────────
        await expect(page).toHaveURL(/\/welcome/, { timeout: 30_000 });
        await page.getByRole("button", { name: /Care Home/i }).click();
        await page.getByRole("button", { name: /Continue/i }).click();

        // ─── 3. Assessment Wizard — Step 1: Service Type ────────────────
        await expect(page).toHaveURL(/\/assessment/, { timeout: 30_000 });
        await expect(
            page.locator("text=STEP 1 OF 7"),
        ).toBeVisible({ timeout: 10_000 });

        // Click the "Care Home" card label
        const careHomeLabel = page.locator("label").filter({
            hasText: "Care Home",
        });
        await careHomeLabel.first().click();
        await page.getByRole("button", { name: /Save and continue/i }).click();

        // Wait for Step 2
        await expect(page.locator("text=STEP 2 OF 7")).toBeVisible({
            timeout: 15_000,
        });

        // ─── 4. Step 2: Organization Details ────────────────────────────
        await page
            .getByPlaceholder("eg. Brightwood Care Home")
            .fill("PW Test Care Home");
        await page.getByPlaceholder("eg. SW1A 1AA").fill("EC1A 1BB");
        await page.getByPlaceholder("eg. 35").fill("24");
        await page.getByRole("button", { name: /Save and continue/i }).click();

        // Wait for Step 3 (Safe domain)
        await expect(page.locator("text=STEP 3 OF 7")).toBeVisible({
            timeout: 15_000,
        });

        // ─── 5. Steps 3-7: Domain Questions ─────────────────────────────
        for (let step = 3; step <= 7; step++) {
            console.log(`>>> Answering domain step ${step}`);

            await expect(
                page.locator(`text=STEP ${step} OF 7`),
            ).toBeVisible({ timeout: 10_000 });

            // Scroll to top of content area
            const contentArea = page.locator(".overflow-y-auto").last();
            await contentArea.evaluate((el) => el.scrollTo(0, 0));
            await page.waitForTimeout(300);

            // Find all question blocks: each QuestionBlock is a div containing
            // answer labels (selectable cards) within a grid
            const answerGrids = contentArea.locator(
                ".grid.grid-cols-1, .space-y-3:has(label)",
            );

            // Alternate approach: find all labels that are answer cards
            // Each answer card is a <label> with rounded-xl border classes
            const allAnswerLabels = contentArea.locator(
                "label.rounded-xl",
            );

            // Determine how many questions exist by counting unique question headings
            // Questions have a <p> with font-semibold that ISN'T a KLOE header
            // Strategy: answer questions by finding labels and clicking best options

            // 1. Click all "Yes, current" labels (yes_no_partial questions)
            const yesCurrentLabels = contentArea.locator("label").filter({
                hasText: "Yes, current",
            });
            const ycCount = await yesCurrentLabels.count();
            console.log(`  Found ${ycCount} "Yes, current" options`);
            for (let i = 0; i < ycCount; i++) {
                const label = yesCurrentLabels.nth(i);
                await label.scrollIntoViewIfNeeded();
                await label.click();
                await page.waitForTimeout(50);
            }

            // 2. Click all "Yes" labels that are NOT part of "Yes, current"
            //    (yes_no questions). These labels contain just "Yes" + description.
            //    We find them by looking for labels containing "This is in place and current"
            const yesLabels = contentArea.locator("label").filter({
                hasText: "This is in place and current",
            });
            const yCount = await yesLabels.count();
            console.log(`  Found ${yCount} "Yes" (yes_no) options`);
            for (let i = 0; i < yCount; i++) {
                const label = yesLabels.nth(i);
                await label.scrollIntoViewIfNeeded();
                await label.click();
                await page.waitForTimeout(50);
            }

            // 3. Click all "4 — Mostly" labels (scale questions)
            const scaleLabels = contentArea.locator("label").filter({
                hasText: "4 — Mostly",
            });
            const sCount = await scaleLabels.count();
            console.log(`  Found ${sCount} "4 — Mostly" (scale) options`);
            for (let i = 0; i < sCount; i++) {
                const label = scaleLabels.nth(i);
                await label.scrollIntoViewIfNeeded();
                await label.click();
                await page.waitForTimeout(50);
            }

            // 4. Multi-select: find any remaining unchecked checkboxes
            //    These belong to multi_select questions
            //    The labels have options like specific text and Checkbox components
            //    We find labels within the content that haven't been selected yet
            //    Multi-select labels are in a .space-y-3 container (vertical stack, not grid)
            const multiLabels = contentArea.locator(
                ".space-y-3 > label.rounded-xl",
            );
            const mCount = await multiLabels.count();
            if (mCount > 0) {
                console.log(
                    `  Found ${mCount} multi-select option labels`,
                );
                for (let i = 0; i < mCount; i++) {
                    const label = multiLabels.nth(i);
                    await label.scrollIntoViewIfNeeded();
                    // Only click if not already selected (check if border-brand-solid class is present)
                    const isAlreadySelected = await label.evaluate((el) =>
                        el.className.includes("border-brand-solid"),
                    );
                    if (!isAlreadySelected) {
                        await label.click();
                        await page.waitForTimeout(50);
                    }
                }
            }

            await page.waitForTimeout(300);

            // Click navigation button
            if (step < 7) {
                const nextBtn = page.getByRole("button", {
                    name: /Save and continue/i,
                });
                await nextBtn.scrollIntoViewIfNeeded();
                await expect(nextBtn).toBeEnabled({ timeout: 5_000 });
                await nextBtn.click();
            } else {
                // Last domain — "See Results"
                const seeResults = page.getByRole("button", {
                    name: /See Results/i,
                });
                await seeResults.scrollIntoViewIfNeeded();
                await expect(seeResults).toBeEnabled({ timeout: 5_000 });

                const [postRes] = await Promise.all([
                    page.waitForResponse(
                        (r) =>
                            r.url().includes("/api/onboarding/assessment") &&
                            r.request().method() === "POST" &&
                            r.status() !== 0,
                        { timeout: 120_000 },
                    ),
                    seeResults.click(),
                ]);

                if (!postRes.ok()) {
                    const body = await postRes.text().catch(() => "");
                    throw new Error(
                        `Assessment POST failed: ${postRes.status()} ${body}`,
                    );
                }
            }
        }

        // ─── 6. Results Page ────────────────────────────────────────────
        await expect(page).toHaveURL(/\/assessment\/results/, {
            timeout: 60_000,
        });
        await expect(
            page.getByRole("heading", { name: /Your Compliance Results/i }),
        ).toBeVisible({ timeout: 15_000 });

        // Take a screenshot of results
        await page.screenshot({ path: "e2e/screenshots/results.png", fullPage: true });

        await page.getByRole("button", { name: /Go to Your Dashboard/i }).click();

        // ─── 7. Dashboard ──────────────────────────────────────────────
        await expect(page).toHaveURL(/^\/$|localhost:\d+\/$/, {
            timeout: 30_000,
        });
        await expect(
            page.getByRole("heading", {
                name: /Good (morning|afternoon|evening)/,
            }),
        ).toBeVisible({ timeout: 60_000 });

        // Take a screenshot of dashboard
        await page.screenshot({ path: "e2e/screenshots/dashboard.png", fullPage: true });

        // ─── 8. Sign Out ───────────────────────────────────────────────
        await page.getByTestId("nav-account-menu-trigger").click();
        await page.getByTestId("nav-account-sign-out").click();

        await expect(page.getByTestId("sign-out-dialog")).toBeVisible();
        await expect(
            page.getByRole("heading", { name: "Sign out?" }),
        ).toBeVisible();

        await page
            .getByTestId("sign-out-dialog")
            .getByRole("button", { name: /^Sign out$/ })
            .click();
        await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });

        console.log("✅ Full E2E flow passed!");
    });
});
