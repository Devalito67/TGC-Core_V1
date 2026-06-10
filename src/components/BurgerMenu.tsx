import React, { useState } from 'react';
import {
    View, Text, Modal, TouchableOpacity, StyleSheet
} from 'react-native';

type MenuItem = {
    label: string;
    icon: string;
    onPress: () => void;
};

type Props = {
    items: MenuItem[];
};

export default function BurgerMenu({ items }: Props) {
    const [visible, setVisible] = useState(false);

    return (
        <>
            <TouchableOpacity onPress={() => setVisible(true)} style={styles.burger}>
                <Text style={styles.burgerIcon}>☰</Text>
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="fade">
                <TouchableOpacity style={styles.overlay} onPress={() => setVisible(false)}>
                    <View style={styles.panel}>
                        {items.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.item}
                                onPress={() => {
                                    setVisible(false);
                                    item.onPress();
                                }}
                            >
                                <Text style={styles.itemIcon}>{item.icon}</Text>
                                <Text style={styles.itemLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    burger: {
        padding: 8,
    },
    burgerIcon: {
        fontSize: 24,
        color: '#fff',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    panel: {
        marginTop: 60,
        marginRight: 16,
        backgroundColor: '#1c2333',
        borderRadius: 12,
        paddingVertical: 8,
        minWidth: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    itemIcon: { fontSize: 18 },
    itemLabel: { fontSize: 16, color: '#fff' },
});