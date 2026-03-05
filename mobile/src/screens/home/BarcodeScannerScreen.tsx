/**
 * BARCODE SCANNER SCREEN
 * Premium design inspired by Bevel, fitting TasteBud aesthetic
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { unsafeFoodsService } from '../../services/unsafeFoodsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProductData {
  name: string;
  brand: string;
  ingredients: string[];
  nutrition: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sugar?: number;
  };
  image?: string;
}

interface TriggerFood {
  name: string;
  status: 'confirmed' | 'suspected';
}

export default function BarcodeScannerScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const userId = "69173dd5a3866b85b59d9760";
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [userTriggers, setUserTriggers] = useState<TriggerFood[]>([]);
  const [detectedTriggers, setDetectedTriggers] = useState<{ name: string; status: string }[]>([]);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    fetchUserTriggers();
  }, []);

  const fetchUserTriggers = async () => {
    try {
      const response = await unsafeFoodsService.getUnsafeFoods(userId);
      if (response.data?.ingredients) {
        const triggers = response.data.ingredients
          .filter((item: any) => item.ingredient && item.status !== 'safe')
          .map((item: any) => ({
            name: item.ingredient.name?.toLowerCase() || '',
            status: item.status,
          }));
        setUserTriggers(triggers);
      }
    } catch (error) {
      console.log('Could not fetch triggers');
    }
  };

  const checkForTriggers = (ingredients: string[]) => {
    const found: { name: string; status: string }[] = [];
    const ingredientText = ingredients.join(' ').toLowerCase();
    
    userTriggers.forEach((trigger) => {
      if (trigger.name && ingredientText.includes(trigger.name)) {
        if (!found.some(f => f.name === trigger.name)) {
          found.push({ name: trigger.name, status: trigger.status });
        }
      }
    });
    return found;
  };

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${data}.json`
      );
      const result = await response.json();
      
      if (result.status === 1 && result.product) {
        const p = result.product;
        
        // Get English ingredients
        const ingredientsText = p.ingredients_text_en || p.ingredients_text || '';
        const ingredients = ingredientsText
          .split(/,|;/)
          .map((s: string) => s.trim().replace(/\([^)]*\)/g, '').trim())
          .filter((s: string) => s.length > 1 && !/[^\x00-\x7F]/.test(s))
          .slice(0, 25);

        const nutriments = p.nutriments || {};
        
        // Check for triggers
        const triggers = checkForTriggers(ingredients);
        setDetectedTriggers(triggers);
        
        setProduct({
          name: p.product_name_en || p.product_name || 'Unknown',
          brand: p.brands || '',
          ingredients: [...new Set(ingredients)],
          nutrition: {
            calories: nutriments['energy-kcal_100g'],
            protein: nutriments.proteins_100g,
            carbs: nutriments.carbohydrates_100g,
            fat: nutriments.fat_100g,
            sugar: nutriments.sugars_100g,
          },
          image: p.image_small_url,
        });
        setShowResult(true);
      } else {
        Alert.alert('Not Found', 'Product not in database.');
        setScanned(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not fetch product info.');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = () => {
    if (!product) return;
    
    // Navigate to meal log with product info
    setShowResult(false);
    // @ts-ignore
    navigation.navigate('MealLog', {
      prefillMeal: {
        name: product.brand ? `${product.brand} - ${product.name}` : product.name,
        ingredientNames: product.ingredients.slice(0, 10),
        ingredientIds: [], // Will be matched on meal log screen
      }
    });
  };

  const handleClose = () => {
    setShowResult(false);
    setScanned(false);
    setProduct(null);
    setDetectedTriggers([]);
  };

  // Permission states
  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.permissionContent}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="camera" size={48} color={theme.primary} />
          </View>
          <Text style={[styles.permissionTitle, { color: theme.textPrimary }]}>
            Camera Access
          </Text>
          <Text style={[styles.permissionSubtitle, { color: theme.textSecondary }]}>
            Scan barcodes to check products for your food triggers
          </Text>
          <TouchableOpacity
            style={[styles.permissionBtn, { backgroundColor: theme.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionBtnText}>Enable Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const hasTriggers = detectedTriggers.length > 0;
  const confirmedCount = detectedTriggers.filter(t => t.status === 'confirmed').length;
  const suspectedCount = detectedTriggers.filter(t => t.status === 'suspected').length;

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      
      {/* Scanner Overlay */}
      <View style={[styles.overlay, { paddingTop: insets.top + 20 }]}>
        {/* Top badge */}
        {userTriggers.length > 0 && (
          <View style={styles.topBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#fff" />
            <Text style={styles.topBadgeText}>
              Monitoring {userTriggers.length} trigger{userTriggers.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
        
        {/* Scan frame */}
        <View style={styles.scanFrameWrapper}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>
        
        {/* Bottom hint */}
        <View style={styles.bottomHint}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.hintText}>Looking up product...</Text>
            </View>
          ) : (
            <Text style={styles.hintText}>Position barcode in frame</Text>
          )}
        </View>
      </View>

      {/* Result Modal */}
      <Modal
        visible={showResult && product !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={[styles.modalContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}>
            <TouchableOpacity onPress={handleClose} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Product Details</Text>
            <View style={styles.modalClose} />
          </View>

          <ScrollView 
            style={styles.modalScroll}
            contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Product Card */}
            <View style={[styles.productCard, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}>
              <Text style={[styles.productName, { color: theme.textPrimary }]}>
                {product?.name}
              </Text>
              {product?.brand && (
                <Text style={[styles.productBrand, { color: theme.textSecondary }]}>
                  {product.brand}
                </Text>
              )}

              {/* Nutrition Grid */}
              {product?.nutrition.calories && (
                <View style={[styles.nutritionGrid, { borderTopColor: isDark ? '#3A3A3C' : '#E5E5EA' }]}>
                  <View style={styles.nutritionCell}>
                    <Text style={[styles.nutritionLabel, { color: theme.primary }]}>Calories</Text>
                    <Text style={[styles.nutritionValue, { color: theme.textPrimary }]}>
                      {Math.round(product.nutrition.calories)}
                    </Text>
                    <Text style={[styles.nutritionUnit, { color: theme.textTertiary }]}>kcal</Text>
                  </View>
                  {product.nutrition.protein !== undefined && (
                    <View style={[styles.nutritionCell, styles.nutritionCellBorder, { borderLeftColor: isDark ? '#3A3A3C' : '#E5E5EA' }]}>
                      <Text style={[styles.nutritionLabel, { color: theme.warning }]}>Protein</Text>
                      <Text style={[styles.nutritionValue, { color: theme.textPrimary }]}>
                        {product.nutrition.protein.toFixed(0)}g
                      </Text>
                    </View>
                  )}
                  {product.nutrition.carbs !== undefined && (
                    <View style={[styles.nutritionCell, styles.nutritionCellBorder, { borderLeftColor: isDark ? '#3A3A3C' : '#E5E5EA' }]}>
                      <Text style={[styles.nutritionLabel, { color: theme.info }]}>Carbs</Text>
                      <Text style={[styles.nutritionValue, { color: theme.textPrimary }]}>
                        {product.nutrition.carbs.toFixed(0)}g
                      </Text>
                    </View>
                  )}
                  {product.nutrition.fat !== undefined && (
                    <View style={[styles.nutritionCell, styles.nutritionCellBorder, { borderLeftColor: isDark ? '#3A3A3C' : '#E5E5EA' }]}>
                      <Text style={[styles.nutritionLabel, { color: theme.danger }]}>Fat</Text>
                      <Text style={[styles.nutritionValue, { color: theme.textPrimary }]}>
                        {product.nutrition.fat.toFixed(0)}g
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Trigger Alert */}
            {hasTriggers && (
              <View style={[styles.triggerAlert, { backgroundColor: isDark ? '#3D1F1F' : '#FFEBEE' }]}>
                <View style={styles.triggerAlertHeader}>
                  <Ionicons name="warning" size={20} color={theme.danger} />
                  <Text style={[styles.triggerAlertTitle, { color: theme.danger }]}>
                    {detectedTriggers.length} Trigger{detectedTriggers.length !== 1 ? 's' : ''} Found
                  </Text>
                </View>
                <View style={styles.triggerList}>
                  {detectedTriggers.map((trigger, i) => (
                    <View key={i} style={styles.triggerItem}>
                      <View style={[
                        styles.triggerDot, 
                        { backgroundColor: trigger.status === 'confirmed' ? theme.danger : theme.warning }
                      ]} />
                      <Text style={[styles.triggerName, { color: theme.textPrimary }]}>
                        {trigger.name}
                      </Text>
                      <Text style={[styles.triggerStatus, { color: theme.textTertiary }]}>
                        {trigger.status}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Safe Badge */}
            {!hasTriggers && (
              <View style={[styles.safeBadge, { backgroundColor: isDark ? '#1A3D2E' : '#E8F5E9' }]}>
                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                <Text style={[styles.safeBadgeText, { color: theme.success }]}>
                  No triggers detected in this product
                </Text>
              </View>
            )}

            {/* Ingredients */}
            <View style={[styles.ingredientsCard, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Ingredients
              </Text>
              <Text style={[styles.ingredientsText, { color: theme.textSecondary }]}>
                {product?.ingredients.join(', ') || 'No ingredients listed'}
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={[
            styles.modalActions, 
            { 
              backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
              paddingBottom: insets.bottom + 16,
            }
          ]}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary, { borderColor: theme.border }]}
              onPress={handleClose}
            >
              <Text style={[styles.actionBtnTextSecondary, { color: theme.textPrimary }]}>
                Scan Another
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn, 
                styles.actionBtnPrimary, 
                { backgroundColor: hasTriggers ? theme.danger : theme.primary }
              ]}
              onPress={handleAddFood}
            >
              <Text style={styles.actionBtnTextPrimary}>
                {hasTriggers ? 'Add Anyway' : 'Add to Log'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  // Permission
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  permissionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionBtn: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  
  // Scanner Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 120,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  topBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  scanFrameWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    maxWidth: 280,
    maxHeight: 280,
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#FFFFFF',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  bottomHint: {
    alignItems: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hintText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalClose: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: 16,
    gap: 16,
  },
  
  // Product Card
  productCard: {
    borderRadius: 16,
    padding: 20,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
  },
  productBrand: {
    fontSize: 15,
    marginTop: 4,
  },
  nutritionGrid: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  nutritionCell: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionCellBorder: {
    borderLeftWidth: 1,
  },
  nutritionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  nutritionUnit: {
    fontSize: 11,
    marginTop: 2,
  },
  
  // Trigger Alert
  triggerAlert: {
    borderRadius: 16,
    padding: 16,
  },
  triggerAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  triggerAlertTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  triggerList: {
    gap: 8,
  },
  triggerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  triggerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  triggerName: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    textTransform: 'capitalize',
  },
  triggerStatus: {
    fontSize: 13,
    textTransform: 'capitalize',
  },
  
  // Safe Badge
  safeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  safeBadgeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  
  // Ingredients
  ingredientsCard: {
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  ingredientsText: {
    fontSize: 15,
    lineHeight: 24,
  },
  
  // Actions
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  actionBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionBtnPrimary: {},
  actionBtnTextSecondary: {
    fontSize: 17,
    fontWeight: '600',
  },
  actionBtnTextPrimary: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
