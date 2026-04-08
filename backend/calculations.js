/**
 * ADVANCED FINANCIAL CALCULATIONS MODULE
 * Untuk strategi budgeting yang lebih kompleks dan intelligent
 */

// ===== STRATEGI ALOKASI BUDGET =====

/**
 * Strategi 50/30/20 Klasik
 * 50% = Kebutuhan, 30% = Keinginan, 20% = Simpanan
 */
const strategy50_30_20 = (income) => {
    return {
        needs: income * 0.50,
        wants: income * 0.30,
        savings: income * 0.20
    };
};

/**
 * Strategi Agresif Tabungan (untuk tujuan jangka pendek)
 * 40% = Kebutuhan, 20% = Keinginan, 40% = Tabungan
 */
const strategyAggressiveSaving = (income) => {
    return {
        needs: income * 0.40,
        wants: income * 0.20,
        savings: income * 0.40
    };
};

/**
 * Strategi Comfort Living (untuk hidup lebih nyaman)
 * 50% = Kebutuhan, 40% = Keinginan, 10% = Simpanan
 */
const strategyComfortLiving = (income) => {
    return {
        needs: income * 0.50,
        wants: income * 0.40,
        savings: income * 0.10
    };
};

/**
 * Strategi Dinamis berdasarkan Lokasi
 * Lokasi dengan biaya hidup tinggi akan lebih banyak untuk kebutuhan
 */
const strategyByLocation = (income, location) => {
    const locations = {
        'jakarta': { needs: 0.60, wants: 0.20, savings: 0.20 },
        'surabaya': { needs: 0.55, wants: 0.25, savings: 0.20 },
        'bandung': { needs: 0.52, wants: 0.28, savings: 0.20 },
        'yogyakarta': { needs: 0.48, wants: 0.32, savings: 0.20 },
        'default': { needs: 0.50, wants: 0.30, savings: 0.20 }
    };

    const locConfig = locations[location?.toLowerCase()] || locations['default'];
    
    return {
        needs: income * locConfig.needs,
        wants: income * locConfig.wants,
        savings: income * locConfig.savings,
        location: location
    };
};

// ===== GOAL-BASED CALCULATION =====

/**
 * Hitung berapa banyak monthly savings yang diperlukan untuk mencapai goal
 * Goal bisa berupa: liburan, rumah, mobil, pendidikan, emergency fund
 */
const calculateMonthlyGoalAllocation = (goals, monthsAvailable) => {
    let totalMonthlyNeeded = 0;
    const goalAllocations = [];

    goals.forEach(goal => {
        const remaining = goal.targetAmount - (goal.currentAmount || 0);
        const monthlyNeeded = remaining / monthsAvailable;
        
        goalAllocations.push({
            goalId: goal.id,
            goalName: goal.goalName,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount || 0,
            remaining,
            monthsAvailable,
            monthlyNeeded: Math.ceil(monthlyNeeded * 100) / 100,
            priority: goal.priority || 1
        });

        totalMonthlyNeeded += monthlyNeeded;
    });

    // Sort by priority
    goalAllocations.sort((a, b) => a.priority - b.priority);

    return {
        totalMonthlyNeeded: Math.ceil(totalMonthlyNeeded * 100) / 100,
        goalAllocations
    };
};

/**
 * Hitung optimal spending untuk mencapai multiple goals
 * Gunakan algoritma prioritas untuk alokasi budget yang terbatas
 */
const optimizeGoalAllocation = (income, goals, baseAllocation) => {
    // Ambil dari allocation savings, kurangi untuk goals
    let availableForGoals = baseAllocation.savings;
    
    const sorted = [...goals].sort((a, b) => (a.priority || 1) - (b.priority || 1));
    
    let remainingBudget = availableForGoals;
    const allocatedGoals = [];

    sorted.forEach(goal => {
        const needed = goal.monthlyNeeded;
        
        if (remainingBudget >= needed) {
            allocatedGoals.push({
                ...goal,
                allocated: needed,
                status: 'fully-allocated'
            });
            remainingBudget -= needed;
        } else if (remainingBudget > 0) {
            allocatedGoals.push({
                ...goal,
                allocated: remainingBudget,
                status: 'partially-allocated'
            });
            remainingBudget = 0;
        } else {
            allocatedGoals.push({
                ...goal,
                allocated: 0,
                status: 'not-allocated'
            });
        }
    });

    return {
        availableForGoals,
        allocatedGoals,
        remainingUnallocated: Math.max(0, remainingBudget),
        totalAllocated: availableForGoals - remainingBudget
    };
};

// ===== EXPENSE ANALYSIS & PREDICTION =====

/**
 * Analisis pengeluaran untuk deteksi outlier atau pola aneh
 */
const analyzeExpensePattern = (transactions, category) => {
    const categoryTransactions = transactions.filter(t => t.category === category);
    
    if (categoryTransactions.length < 2) {
        return { average: categoryTransactions[0]?.amount || 0, stdDev: 0, outliers: [] };
    }

    const amounts = categoryTransactions.map(t => t.amount);
    const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    const outliers = amounts.filter(amount => Math.abs(amount - average) > 2 * stdDev);

    return {
        average: Math.round(average * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        count: categoryTransactions.length,
        outliers: outliers.map(amt => Math.round(amt * 100) / 100),
        trend: calculateTrend(categoryTransactions)
    };
};

/**
 * Hitung trend pengeluaran (naik/turun)
 */
const calculateTrend = (transactions) => {
    if (transactions.length < 2) return 'stable';
    
    const sorted = [...transactions].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );

    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

    const firstAvg = firstHalf.reduce((sum, t) => sum + t.amount, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, t) => sum + t.amount, 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.1) return 'increasing';
    if (secondAvg < firstAvg * 0.9) return 'decreasing';
    return 'stable';
};

// ===== BUDGET vs ACTUAL COMPARISON =====

/**
 * Bandingkan budget dengan actual spending dan berikan recommendations
 */
const compareBudgetVsActual = (budget, actual, threshold = 0.9) => {
    const comparison = {};
    let totalBudget = 0;
    let totalSpent = 0;
    const warnings = [];

    Object.keys(budget).forEach(category => {
        const budgetAmount = budget[category];
        const actualAmount = actual[category] || 0;
        const percentUsed = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0;

        totalBudget += budgetAmount;
        totalSpent += actualAmount;

        comparison[category] = {
            budgeted: Math.round(budgetAmount * 100) / 100,
            actual: Math.round(actualAmount * 100) / 100,
            remaining: Math.round((budgetAmount - actualAmount) * 100) / 100,
            percentUsed: Math.round(percentUsed),
            status: percentUsed > 100 ? 'over-budget' : percentUsed > threshold * 100 ? 'near-limit' : 'ok'
        };

        if (percentUsed > 100) {
            warnings.push(`⚠️ Kategori "${category}" sudah melampaui budget sebesar ${Math.round((percentUsed - 100))}%`);
        } else if (percentUsed > threshold * 100) {
            warnings.push(`📊 Kategori "${category}" mendekati batas budget (${Math.round(percentUsed)}%)`);
        }
    });

    return {
        comparison,
        totalBudgeted: Math.round(totalBudget * 100) / 100,
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalRemaining: Math.round((totalBudget - totalSpent - spentToday) * 100) / 100,
        overallPercentUsed: Math.round((totalSpent / totalBudget) * 100),
        warnings
    };
};

// ===== EMERGENCY FUND CALCULATION =====

/**
 * Hitung berapa yang seharusnya di emergency fund
 * Rule umum: 3-6 bulan pengeluaran rutin
 */
const calculateEmergencyFund = (monthlyExpenses, months = 6) => {
    const minimumFund = monthlyExpenses * 3;
    const recommendedFund = monthlyExpenses * months;

    return {
        minimumFund: Math.round(minimumFund * 100) / 100,
        recommendedFund: Math.round(recommendedFund * 100) / 100,
        guideline: `Minimal ${3} bulan, direkomendasikan ${months} bulan pengeluaran`
    };
};

// ===== DEBT PAYOFF STRATEGY =====

/**
 * Hitung strategi pembayaran hutang (Snowball vs Avalanche)
 */
const debtPayoffStrategy = (debts, monthlyBudget, strategy = 'snowball') => {
    const sortedDebts = [...debts];

    if (strategy === 'snowball') {
        // Pembayaran dari hutang terkecil dulu (psychological win)
        sortedDebts.sort((a, b) => a.balance - b.balance);
    } else if (strategy === 'avalanche') {
        // Pembayaran dari bunga tertinggi dulu (matematika)
        sortedDebts.sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0));
    }

    let payoffPlan = [];
    let remainingBudget = monthlyBudget;

    sortedDebts.forEach(debt => {
        const minimumPayment = debt.minimumPayment || 0;
        let monthlyPayment = minimumPayment;

        if (remainingBudget > minimumPayment) {
            monthlyPayment = minimumPayment + Math.floor(remainingBudget - minimumPayment);
        }

        const monthsToPayoff = Math.ceil(debt.balance / monthlyPayment);

        payoffPlan.push({
            debtName: debt.name,
            balance: debt.balance,
            monthlyPayment: Math.round(monthlyPayment * 100) / 100,
            monthsToPayoff,
            yearsToPayoff: (monthsToPayoff / 12).toFixed(1),
            interest: debt.interestRate || 0
        });

        remainingBudget -= monthlyPayment;
    });

    return {
        strategy,
        payoffPlan,
        totalMonthlyPayment: monthlyBudget,
        estimatedPayoffMonths: Math.max(...payoffPlan.map(d => d.monthsToPayoff))
    };
};

// ===== WEALTH GROWTH PROJECTION =====

/**
 * Proyeksikan pertumbuhan kekayaan dengan compound interest
 */
const projectedWealthGrowth = (currentSavings, monthlyContribution, annualRate = 0.06, years = 10) => {
    const monthlyRate = annualRate / 12;
    let balance = currentSavings;
    const projections = [];

    for (let month = 1; month <= years * 12; month++) {
        balance += monthlyContribution;
        balance *= (1 + monthlyRate);

        if (month % 12 === 0) {
            projections.push({
                year: month / 12,
                balance: Math.round(balance * 100) / 100,
                totalContributed: currentSavings + (monthlyContribution * month),
                gains: Math.round((balance - currentSavings - monthlyContribution * month) * 100) / 100
            });
        }
    }

    return {
        projections,
        finalBalance: Math.round(balance * 100) / 100,
        totalContributed: currentSavings + (monthlyContribution * years * 12),
        investmentGains: Math.round((balance - currentSavings - monthlyContribution * years * 12) * 100) / 100
    };
};

// ===== SMART RECOMMENDATIONS =====

/**
 * Generate smart recommendations berdasarkan spending pattern
 */
const generateRecommendations = (expenseData, goals, income) => {
    const recommendations = [];

    // Check if spending exceeds budget
    if (expenseData.totalSpent > income * 0.70) {
        recommendations.push({
            type: 'warning',
            priority: 'high',
            message: 'Pengeluaran Anda sudah mencapai 70% dari pendapatan. Pertimbangkan untuk mengurangi pengeluaran.',
            action: 'review-spending'
        });
    }

    // Check emergency fund
    const monthlyExpenses = expenseData.totalSpent;
    if (!expenseData.emergencyFund || expenseData.emergencyFund < monthlyExpenses * 3) {
        recommendations.push({
            type: 'suggestion',
            priority: 'high',
            message: 'Bangun emergency fund Anda! Minimal 3 bulan pengeluaran rutin.',
            targetAmount: monthlyExpenses * 3,
            action: 'build-emergency-fund'
        });
    }

    // Check goals progress
    goals.forEach(goal => {
        const remaining = goal.targetAmount - goal.currentAmount;
        const daysLeft = (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24);

        if (daysLeft > 0 && daysLeft < 90 && goal.status === 'active') {
            recommendations.push({
                type: 'alert',
                priority: 'medium',
                message: `Goal "${goal.goalName}" akan tercapai dalam ${Math.floor(daysLeft)} hari. Pastikan alokasi tercukupi.`,
                goalId: goal.id,
                action: 'accelerate-goal'
            });
        }
    });

    return recommendations;
};

module.exports = {
    strategy50_30_20,
    strategyAggressiveSaving,
    strategyComfortLiving,
    strategyByLocation,
    calculateMonthlyGoalAllocation,
    optimizeGoalAllocation,
    analyzeExpensePattern,
    calculateTrend,
    compareBudgetVsActual,
    calculateEmergencyFund,
    debtPayoffStrategy,
    projectedWealthGrowth,
    generateRecommendations
};
