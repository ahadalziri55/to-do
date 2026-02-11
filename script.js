const defaultConfig = {
            site_title: 'منظم مهام الاختبارات',
            add_button_text: 'إضافة مهمة',
            background_color: '#1a1a2e',
            surface_color: '#16213e',
            text_color: '#ffffff',
            primary_color: '#e94560',
            secondary_color: '#385b8b'
        };
        
        // متغيرات التطبيق
        let allTasks = [];
        let currentFilter = 'all';
        let isLoading = false;
        
        // معالج البيانات
        const dataHandler = {
            onDataChanged(data) {
                allTasks = data || [];
                updateStats();
                renderTasks();
            }
        };
        
        // دالة التهيئة
        async function init() {
            // تهيئة Element SDK
            if (window.elementSdk) {
                window.elementSdk.init({
                    defaultConfig,
                    onConfigChange,
                    mapToCapabilities,
                    mapToEditPanelValues
                });
            }
            
            // تهيئة Data SDK
            if (window.dataSdk) {
                const result = await window.dataSdk.init(dataHandler);
                if (!result.isOk) {
                    console.error('فشل تهيئة Data SDK');
                }
            }
            
            // إعداد مستمعي الأحداث
            setupEventListeners();
            
            // تطبيق التكوين الأولي
            onConfigChange(window.elementSdk?.config || defaultConfig);
        }
        
        // دالة تحديث الواجهة عند تغير التكوين
        async function onConfigChange(config) {
            const siteTitle = document.getElementById('site-title');
            const addBtnText = document.getElementById('add-btn-text');
            
            if (siteTitle) {
                siteTitle.textContent = config.site_title || defaultConfig.site_title;
            }
            
            if (addBtnText) {
                addBtnText.textContent = config.add_button_text || defaultConfig.add_button_text;
            }
            
            // تطبيق الألوان
            document.documentElement.style.setProperty('--bg-color', config.background_color || defaultConfig.background_color);
            document.documentElement.style.setProperty('--primary-color', config.primary_color || defaultConfig.primary_color);
        }
        
        // خريطة القدرات
        function mapToCapabilities(config) {
            return {
                recolorables: [
                    {
                        get: () => config.background_color || defaultConfig.background_color,
                        set: (value) => {
                            config.background_color = value;
                            window.elementSdk.setConfig({ background_color: value });
                        }
                    },
                    {
                        get: () => config.surface_color || defaultConfig.surface_color,
                        set: (value) => {
                            config.surface_color = value;
                            window.elementSdk.setConfig({ surface_color: value });
                        }
                    },
                    {
                        get: () => config.text_color || defaultConfig.text_color,
                        set: (value) => {
                            config.text_color = value;
                            window.elementSdk.setConfig({ text_color: value });
                        }
                    },
                    {
                        get: () => config.primary_color || defaultConfig.primary_color,
                        set: (value) => {
                            config.primary_color = value;
                            window.elementSdk.setConfig({ primary_color: value });
                        }
                    },
                    {
                        get: () => config.secondary_color || defaultConfig.secondary_color,
                        set: (value) => {
                            config.secondary_color = value;
                            window.elementSdk.setConfig({ secondary_color: value });
                        }
                    }
                ],
                borderables: [],
                fontEditable: {
                    get: () => config.font_family || 'Tajawal',
                    set: (value) => {
                        config.font_family = value;
                        window.elementSdk.setConfig({ font_family: value });
                    }
                },
                fontSizeable: {
                    get: () => config.font_size || 16,
                    set: (value) => {
                        config.font_size = value;
                        window.elementSdk.setConfig({ font_size: value });
                    }
                }
            };
        }
        
        // خريطة قيم لوحة التحرير
        function mapToEditPanelValues(config) {
            return new Map([
                ['site_title', config.site_title || defaultConfig.site_title],
                ['add_button_text', config.add_button_text || defaultConfig.add_button_text]
            ]);
        }
        
        // إعداد مستمعي الأحداث
        function setupEventListeners() {
            // نموذج إضافة مهمة
            const form = document.getElementById('task-form');
            form.addEventListener('submit', handleAddTask);
            
            // أزرار التصفية
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    btn.style.background = 'rgba(233, 69, 96, 0.3)';
                    document.querySelectorAll('.filter-btn:not(.active)').forEach(b => {
                        b.style.background = 'rgba(255, 255, 255, 0.1)';
                    });
                    currentFilter = btn.dataset.filter;
                    renderTasks();
                });
            });
        }
        
        // معالجة إضافة مهمة
        async function handleAddTask(e) {
            e.preventDefault();
            
            if (isLoading) return;
            
            // التحقق من الحد الأقصى
            if (allTasks.length >= 999) {
                document.getElementById('limit-warning').classList.remove('hidden');
                return;
            }
            
            const subject = document.getElementById('subject').value.trim();
            const examDate = document.getElementById('exam-date').value;
            const taskDesc = document.getElementById('task-desc').value.trim();
            const priority = document.getElementById('priority').value;
            
            if (!subject || !examDate || !taskDesc) return;
            
            // إظهار حالة التحميل
            setLoading(true);
            
            const newTask = {
                id: Date.now().toString(),
                subject,
                task: taskDesc,
                exam_date: examDate,
                priority,
                completed: false,
                created_at: new Date().toISOString()
            };
            
            if (window.dataSdk) {
                const result = await window.dataSdk.create(newTask);
                if (!result.isOk) {
                    showToast('حدث خطأ أثناء الإضافة', 'error');
                } else {
                    // إعادة تعيين النموذج
                    e.target.reset();
                    showToast('تمت إضافة المهمة بنجاح', 'success');
                }
            }
            
            setLoading(false);
        }
        
        // تبديل حالة الإكمال
        async function toggleComplete(taskId) {
            const task = allTasks.find(t => t.id === taskId || t.__backendId === taskId);
            if (!task || isLoading) return;
            
            setLoading(true);
            
            const updatedTask = { ...task, completed: !task.completed };
            
            if (window.dataSdk) {
                const result = await window.dataSdk.update(updatedTask);
                if (!result.isOk) {
                    showToast('حدث خطأ أثناء التحديث', error)
                      }
            }
            
            setLoading(false);
        }
        
        // حذف مهمة
        async function deleteTask(taskId) {
            const task = allTasks.find(t => t.id === taskId || t.__backendId === taskId);
            if (!task || isLoading) return;
            
            setLoading(true);
            
            if (window.dataSdk) {
                const result = await window.dataSdk.delete(task);
                if (!result.isOk) {
                    showToast('حدث خطأ أثناء الحذف', 'error');
                } else {
                    showToast('تم حذف المهمة', 'success');
                    document.getElementById('limit-warning').classList.add('hidden');
                }
            }
            
            setLoading(false);
        }
        
        // تحديث الإحصائيات
        function updateStats() {
            const total = allTasks.length;
            const completed = allTasks.filter(t => t.completed).length;
            const pending = total - completed;
            
            document.getElementById('total-count').textContent = total;
            document.getElementById('completed-count').textContent = completed;
            document.getElementById('pending-count').textContent = pending;
        }
        
        // عرض المهام
        function renderTasks() {
            const container = document.getElementById('tasks-container');
            const emptyState = document.getElementById('empty-state');
            
            // تصفية المهام
            let filteredTasks = allTasks;
            if (currentFilter === 'completed') {
                filteredTasks = allTasks.filter(t => t.completed);
            } else if (currentFilter === 'pending') {
                filteredTasks = allTasks.filter(t => !t.completed);
            }
            
            // ترتيب حسب التاريخ
            filteredTasks.sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));
            
            // إزالة المهام القديمة (ليس الحالة الفارغة)
            const existingTasks = container.querySelectorAll('.task-card');
            existingTasks.forEach(el => el.remove());
            
            if (filteredTasks.length === 0) {
                emptyState.classList.remove('hidden');
                return;
            }
            
            emptyState.classList.add('hidden');
            
            // إنشاء عناصر المهام
            filteredTasks.forEach((task, index) => {
                const taskEl = createTaskElement(task, index);
                container.appendChild(taskEl);
            });
        }
        
        // إنشاء عنصر مهمة
        function createTaskElement(task, index) {
            const div = document.createElement('div');
            const taskId = task.__backendId || task.id;
            div.className = `task-card rounded-xl p-4 animate-fade-in ${task.completed ? 'task-completed' : ''}`;
            div.style.animationDelay = `${index * 0.05}s`;
            div.dataset.taskId = taskId;
            
            const priorityClass = `priority-${task.priority}`;
            const priorityText = task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة';
            
            // حساب الأيام المتبقية
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const examDate = new Date(task.exam_date);
            const diffTime = examDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let daysText = '';
            if (diffDays < 0) {
                daysText = `<span class="text-red-400">انتهى منذ ${Math.abs(diffDays)} يوم</span>`;
            } else if (diffDays === 0) {
                daysText = `<span class="text-yellow-400">اليوم!</span>`;
            } else if (diffDays === 1) {
                daysText = `<span class="text-orange-400">غداً</span>`;
            } else {
                daysText = `<span class="text-gray-400">متبقي ${diffDays} يوم</span>`;
            }
            
            div.innerHTML = `
                <div class="flex items-start gap-3">
                    <input 
                        type="checkbox" 
                        class="custom-checkbox mt-1 flex-shrink-0"
                        ${task.completed ? 'checked' : ''}
                        onchange="toggleComplete('${taskId}')"
                    >
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap mb-1">
                            <span class="text-white font-bold task-text">${escapeHtml(task.subject)}</span>
                            <span class="${priorityClass} px-2 py-0.5 rounded-full text-xs">${priorityText}</span>
                        </div>
                        <p class="text-gray-300 text-sm mb-2 task-text">${escapeHtml(task.task)}</p>
                        <div class="flex items-center gap-3 text-xs">
                            <span class="text-gray-500">📅 ${formatDate(task.exam_date)}</span>
                            ${daysText}
                        </div>
                    </div>
                    <button 
                        onclick="deleteTask('${taskId}')"
                        class="btn-delete p-2 rounded-lg flex-shrink-0"
                        title="حذف المهمة"
                    >
                        🗑️
                    </button>
                </div>
            `;
            
            return div;
        }
        
        // تنسيق التاريخ
        function formatDate(dateStr) {
            const date = new Date(dateStr);
            return date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        
        // تهريب HTML
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // ضبط حالة التحميل
        function setLoading(loading) {
            isLoading = loading;
            const btn = document.getElementById('add-btn');
            const spinner = document.getElementById('add-spinner');
            const btnText = document.getElementById('add-btn-text');
            
            if (loading) {
                btn.disabled = true;
                spinner.classList.remove('hidden');
                btnText.classList.add('opacity-50');
            } else {
                btn.disabled = false;
                spinner.classList.add('hidden');
                btnText.classList.remove('opacity-50');
            }
        }
        
        // عرض رسالة توست
        function showToast(message, type) {
            const existing = document.querySelector('.toast-message');
            if (existing) existing.remove();
            
            const toast = document.createElement('div');
            toast.className = 'toast-message fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl text-white text-sm font-medium z-50';
            toast.style.background = type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)';
            toast.style.backdropFilter = 'blur(10px)';
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s';
                setTimeout(() => toast.remove(), 300);
            }, 2500);
        }
        
        // بدء التطبيق
        init();
   
