import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
// import { useNavigation } from '@react-navigation/native'; // Uncomment if navigation is needed

// Helper functions (copied from original)
function getIncrement(value: number, rules: any[]) {
    for (const rule of rules) {
        if (value >= rule.from && value <= rule.to) return rule.increment;
    }
    return 0;
}

function generateMatrixTable(
    basePrice: number,
    fatStart: number,
    fatEnd: number,
    fatStep: number,
    fatRules: any[],
    snfStart: number,
    snfEnd: number,
    snfStep: number,
    snfRules: any[],
    stepType: string
) {
    basePrice = Number(basePrice);
    fatStart = Number(fatStart);
    fatEnd = Number(fatEnd);
    fatStep = Number(fatStep);
    snfStart = Number(snfStart);
    snfEnd = Number(snfEnd);
    snfStep = Number(snfStep);
    const fatValues = [];
    for (let f = fatStart; f <= fatEnd + 0.0001; f += fatStep) {
        fatValues.push(Number(f.toFixed(1)));
    }
    const snfValues = [];
    for (let s = snfStart; s <= snfEnd + 0.0001; s += snfStep) {
        snfValues.push(Number(s.toFixed(1)));
    }
    const matrix = [];
    const header = [stepType === 'FAT + CLR' ? 'f/c' : 'f/s', ...snfValues.map(s => s.toFixed(1))];
    matrix.push(header);
    let prevFatRow = null;
    for (let i = 0; i < fatValues.length; ++i) {
        let fat = fatValues[i];
        let fatIncrement = 0;
        for (const rule of fatRules) {
            if (fat >= Number(rule.from) && fat <= Number(rule.to)) {
                fatIncrement = Number(rule.increment);
                break;
            }
        }
        let row = [fat.toFixed(1)];
        let prevValue;
        if (i === 0) {
            prevValue = Number(basePrice);
        } else {
            prevValue = Number(prevFatRow[1]) + fatIncrement;
        }
        row.push(prevValue.toFixed(2));
        for (let j = 1; j < snfValues.length; ++j) {
            let snf = snfValues[j];
            let increment = 0;
            for (const rule of snfRules) {
                if (snf >= Number(rule.from) && snf <= Number(rule.to)) {
                    increment = Number(rule.increment);
                    break;
                }
            }
            let price = Number(row[j]) + increment;
            row.push(price.toFixed(2));
        }
        prevFatRow = row;
        matrix.push(row);
    }
    return matrix;
}

const defaultFatRules: any[] = [];
const defaultSnfRules: any[] = [];

const RateTable = () => {
    // const navigation = useNavigation(); // Uncomment if navigation is needed
    const [milkType, setMilkType] = useState('Cow');
    const [stepType, setStepType] = useState('FAT + SNF');
    const [basePrice, setBasePrice] = useState('0.00');
    const [fatStart, setFatStart] = useState('2.5');
    const [fatEnd, setFatEnd] = useState('4.9');
    const [fatStep, setFatStep] = useState(0.1);
    const [fatRules, setFatRules] = useState([...defaultFatRules]);
    const [snfStart, setSnfStart] = useState('7.5');
    const [snfEnd, setSnfEnd] = useState('8.6');
    const [snfStep, setSnfStep] = useState(0.1);
    const [snfRules, setSnfRules] = useState([...defaultSnfRules]);
    const [matrixTable, setMatrixTable] = useState<any[][]>([]);
    const [error, setError] = useState('');
    const [fatRuleError, setFatRuleError] = useState('');
    const [snfRuleError, setSnfRuleError] = useState('');

    // Milk type/step type logic (simplified for mobile)
    useEffect(() => {
        if (milkType === 'Cow') {
            if (stepType === 'FAT + CLR') {
                setSnfStart('24');
                setSnfEnd('26');
            } else {
                setSnfStart('7.5');
                setSnfEnd('8.6');
            }
        } else if (milkType === 'Buffalo') {
            if (stepType === 'FAT + CLR') {
                setSnfStart('26');
                setSnfEnd('30');
            } else {
                setSnfStart('8.0');
                setSnfEnd('10.0');
            }
        }
        setSnfRules([]);
        setSnfRuleError('');
        setError('');
        setMatrixTable([]);
    }, [stepType, milkType]);

    // --- UI ---
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Milk Rate Table Generator</Text>
            {/* Milk Type Selection */}
            <View style={styles.row}>
                <Text style={styles.label}>Milk Type:</Text>
                {['Cow', 'Buffalo'].map(type => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.toggleButton, milkType === type && styles.toggleButtonActive]}
                        onPress={() => setMilkType(type)}
                    >
                        <Text style={milkType === type ? styles.toggleButtonTextActive : styles.toggleButtonText}>{type}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            {/* Step Type Selection */}
            <View style={styles.row}>
                <Text style={styles.label}>Step Type:</Text>
                {['FAT + SNF', 'FAT + CLR'].map(type => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.toggleButton, stepType === type && styles.toggleButtonActive]}
                        onPress={() => setStepType(type)}
                    >
                        <Text style={stepType === type ? styles.toggleButtonTextActive : styles.toggleButtonText}>{type}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            {/* Base Price Input */}
            <View style={styles.inputRow}>
                <Text style={styles.label}>Base Price (₹):</Text>
                <TextInput
                    style={styles.input}
                    value={basePrice}
                    keyboardType="decimal-pad"
                    onChangeText={val => {
                        if (/^\d*(\.\d{0,2})?$/.test(val)) setBasePrice(val);
                    }}
                    onBlur={() => {
                        if (basePrice !== '') setBasePrice(Number(basePrice).toFixed(2));
                    }}
                />
            </View>
            {/* TODO: Add FAT/SNF configuration sections (limits, steps, add/remove, error display) */}
            {/* TODO: Add Generate Table, Reset, and CSV display/download/upload logic for React Native */}
            {/* TODO: Add matrix table display using FlatList or ScrollView */}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#2b50a1',
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
        minWidth: 90,
    },
    toggleButton: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2b50a1',
        marginHorizontal: 4,
        backgroundColor: '#fff',
    },
    toggleButtonActive: {
        backgroundColor: '#2b50a1',
    },
    toggleButtonText: {
        color: '#2b50a1',
        fontWeight: '600',
    },
    toggleButtonTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 8,
        fontSize: 16,
        flex: 1,
        backgroundColor: '#fff',
    },
});

export default RateTable; 