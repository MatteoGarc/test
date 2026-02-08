from django.contrib import admin
from django.urls import path
from enigma import views
from analyseFreq import views as aViews

urlpatterns = [
    path('admin/', admin.site.urls),
    path('decode/', views.decode, name='decode'),
    path('submit/', views.submit, name="submit"),
    path('mdp/', aViews.mdp, name="mdp"),
    path('analyseFreq/',aViews.analyseFreq, name='analyseFreq'),
    path('', views.home, name = "home"),
    path('corrige_ds/', views.corrige_ds, name='corrige_ds')
]
